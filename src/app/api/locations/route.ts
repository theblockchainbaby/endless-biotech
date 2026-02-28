import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError, parseBody } from "@/lib/api-helpers";
import { createLocationSchema } from "@/lib/validations";

export async function GET() {
  try {
    const user = await requireAuth();

    const locations = await prisma.location.findMany({
      where: { site: { organizationId: user.organizationId }, isActive: true },
      include: {
        site: { select: { id: true, name: true } },
        parent: { select: { id: true, name: true } },
        _count: { select: { vessels: true, children: true } },
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(locations);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await parseBody(req, createLocationSchema);

    // Verify site belongs to user's org
    const site = await prisma.site.findFirst({
      where: { id: body.siteId, organizationId: user.organizationId },
    });
    if (!site) return NextResponse.json({ error: "Site not found" }, { status: 404 });

    const location = await prisma.location.create({
      data: {
        name: body.name,
        type: body.type,
        siteId: body.siteId,
        parentId: body.parentId ?? null,
        capacity: body.capacity ?? null,
        conditions: body.conditions ? (body.conditions as Prisma.InputJsonValue) : Prisma.JsonNull,
      },
      include: {
        site: { select: { id: true, name: true } },
        _count: { select: { vessels: true } },
      },
    });

    return NextResponse.json(location, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
