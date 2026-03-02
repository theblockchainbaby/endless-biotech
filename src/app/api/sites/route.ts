import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError, ApiError } from "@/lib/api-helpers";
import { z } from "zod";

const createSiteSchema = z.object({
  name: z.string().min(1, "Site name is required"),
  address: z.string().nullable().optional(),
});

export async function GET() {
  try {
    const user = await requireAuth();

    const sites = await prisma.site.findMany({
      where: { organizationId: user.organizationId },
      include: {
        _count: { select: { locations: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(sites);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = createSiteSchema.parse(await req.json());

    // Check for duplicate name
    const existing = await prisma.site.findFirst({
      where: { name: body.name, organizationId: user.organizationId },
    });
    if (existing) {
      throw new ApiError(`A site named "${body.name}" already exists`, 409);
    }

    const site = await prisma.site.create({
      data: {
        name: body.name,
        address: body.address || null,
        organizationId: user.organizationId,
      },
    });

    return NextResponse.json(site, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
