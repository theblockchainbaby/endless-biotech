import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError, parseBody } from "@/lib/api-helpers";
import { advanceStageSchema } from "@/lib/validations";
import { logActivity } from "@/lib/activity-logger";
import { STAGES, DEFAULT_SUBCULTURE_INTERVAL_DAYS } from "@/lib/constants";

const stageOrder = STAGES;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await parseBody(req, advanceStageSchema);

    const vessel = await prisma.vessel.findFirst({
      where: { id, organizationId: user.organizationId },
    });
    if (!vessel) return NextResponse.json({ error: "Vessel not found" }, { status: 404 });

    const currentIndex = stageOrder.indexOf(vessel.stage as typeof stageOrder[number]);
    if (currentIndex === -1 || currentIndex >= stageOrder.length - 1) {
      return NextResponse.json({ error: "Cannot advance past final stage" }, { status: 400 });
    }

    const nextStage = stageOrder[currentIndex + 1];
    const previousStage = vessel.stage;

    // If entering multiplication, calculate next subculture date
    const data: Record<string, unknown> = { stage: nextStage };
    if (nextStage === "multiplication") {
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + DEFAULT_SUBCULTURE_INTERVAL_DAYS);
      data.nextSubcultureDate = nextDate;
      data.plantedAt = new Date();
    }

    const updated = await prisma.vessel.update({
      where: { id },
      data,
      include: { cultivar: true, location: true },
    });

    await logActivity({
      vesselId: id,
      userId: user.id,
      type: "stage_advanced",
      category: "vessel",
      previousState: { stage: previousStage },
      newState: { stage: nextStage },
      notes: body.notes || `Advanced from ${previousStage} to ${nextStage}`,
    });

    return NextResponse.json(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
