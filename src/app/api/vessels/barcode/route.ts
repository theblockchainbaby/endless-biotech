import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");

    if (!code) return NextResponse.json({ error: "Barcode required" }, { status: 400 });

    const vessel = await prisma.vessel.findFirst({
      where: { barcode: code, organizationId: user.organizationId },
      include: {
        cultivar: true,
        location: true,
        mediaRecipe: true,
        parentVessel: { select: { id: true, barcode: true } },
        childVessels: { select: { id: true, barcode: true, status: true } },
        activities: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    const isDisposed = vessel?.status === "disposed" || vessel?.status === "multiplied";

    return NextResponse.json({ found: !!vessel, vessel, isDisposed });
  } catch (error) {
    return handleApiError(error);
  }
}
