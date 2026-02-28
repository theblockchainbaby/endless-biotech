import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError, parseBody } from "@/lib/api-helpers";
import { updateLocationSchema } from "@/lib/validations";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const location = await prisma.location.findFirst({
      where: { id, site: { organizationId: user.organizationId } },
      include: {
        site: true,
        parent: { select: { id: true, name: true } },
        children: { select: { id: true, name: true, type: true, _count: { select: { vessels: true } } } },
        vessels: {
          include: { cultivar: { select: { name: true } } },
          orderBy: { updatedAt: "desc" },
          take: 50,
        },
        _count: { select: { vessels: true } },
        environmentReadings: { orderBy: { recordedAt: "desc" }, take: 10 },
      },
    });

    if (!location) return NextResponse.json({ error: "Location not found" }, { status: 404 });
    return NextResponse.json(location);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await parseBody(req, updateLocationSchema);

    const existing = await prisma.location.findFirst({
      where: { id, site: { organizationId: user.organizationId } },
    });
    if (!existing) return NextResponse.json({ error: "Location not found" }, { status: 404 });

    const { siteId, conditions, ...rest } = body;
    const data: Record<string, unknown> = { ...rest };
    if (siteId) data.site = { connect: { id: siteId } };
    if (conditions !== undefined) data.conditions = conditions;

    const location = await prisma.location.update({
      where: { id },
      data,
    });

    return NextResponse.json(location);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const existing = await prisma.location.findFirst({
      where: { id, site: { organizationId: user.organizationId } },
      include: { _count: { select: { vessels: true } } },
    });
    if (!existing) return NextResponse.json({ error: "Location not found" }, { status: 404 });
    if (existing._count.vessels > 0) {
      return NextResponse.json({ error: "Cannot delete location with vessels" }, { status: 400 });
    }

    await prisma.location.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
