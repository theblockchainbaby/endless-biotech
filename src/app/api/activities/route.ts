import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    const vesselId = searchParams.get("vesselId");
    const type = searchParams.get("type");
    const category = searchParams.get("category");
    const limit = parseInt(searchParams.get("limit") || "100");

    const where: Record<string, unknown> = {
      vessel: { organizationId: user.organizationId },
    };
    if (vesselId) where.vesselId = vesselId;
    if (type) where.type = type;
    if (category) where.category = category;

    const activities = await prisma.activity.findMany({
      where,
      include: {
        vessel: { select: { id: true, barcode: true } },
        user: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json(activities);
  } catch (error) {
    return handleApiError(error);
  }
}
