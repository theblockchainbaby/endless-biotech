import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/api-helpers";
import { logActivity } from "@/lib/activity-logger";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    const vesselId = searchParams.get("vesselId");
    const cultivarId = searchParams.get("cultivarId");

    const where: Record<string, unknown> = {};
    if (vesselId) {
      // Verify vessel belongs to org
      const vessel = await prisma.vessel.findFirst({
        where: { id: vesselId, organizationId: user.organizationId },
      });
      if (!vessel) return NextResponse.json({ error: "Vessel not found" }, { status: 404 });
      where.vesselId = vesselId;
    }
    if (cultivarId) {
      where.cultivarId = cultivarId;
    }

    const photos = await prisma.photo.findMany({
      where,
      include: {
        takenBy: { select: { id: true, name: true } },
        vessel: { select: { id: true, barcode: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(photos);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();

    const { url, thumbnailUrl, vesselId, cultivarId, caption, stage } = body;

    if (!url) {
      return NextResponse.json({ error: "Photo URL is required" }, { status: 400 });
    }

    // Verify vessel/cultivar belongs to org if provided
    if (vesselId) {
      const vessel = await prisma.vessel.findFirst({
        where: { id: vesselId, organizationId: user.organizationId },
      });
      if (!vessel) return NextResponse.json({ error: "Vessel not found" }, { status: 404 });
    }

    const photo = await prisma.photo.create({
      data: {
        url,
        thumbnailUrl: thumbnailUrl || null,
        vesselId: vesselId || null,
        cultivarId: cultivarId || null,
        caption: caption || null,
        stage: stage || null,
        takenById: user.id,
      },
    });

    if (vesselId) {
      await logActivity({
        vesselId,
        userId: user.id,
        type: "photo_added",
        category: "vessel",
        notes: caption || "Photo added",
      });
    }

    return NextResponse.json(photo, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
