import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError, ApiError } from "@/lib/api-helpers";
import { logActivity } from "@/lib/activity-logger";

const REVERSIBLE_TYPES = ["stage_advanced", "health_update", "location_changed", "disposed"];

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const vessel = await prisma.vessel.findFirst({
      where: { id, organizationId: user.organizationId },
    });
    if (!vessel) throw new ApiError("Vessel not found", 404);

    // Find the most recent reversible activity
    const lastActivity = await prisma.activity.findFirst({
      where: { vesselId: id, type: { in: REVERSIBLE_TYPES } },
      orderBy: { createdAt: "desc" },
    });

    if (!lastActivity) {
      throw new ApiError("No reversible actions found for this vessel", 400);
    }

    // Check if the action was within the last 30 minutes
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    if (new Date(lastActivity.createdAt) < thirtyMinutesAgo) {
      throw new ApiError("Can only undo actions from the last 30 minutes", 400);
    }

    const previousState = lastActivity.previousState as Record<string, unknown> | null;
    if (!previousState || Object.keys(previousState).length === 0) {
      throw new ApiError("Cannot undo: no previous state was recorded", 400);
    }

    // Build the update data from the previous state
    const updateData: Record<string, unknown> = {};
    const allowedFields = ["stage", "status", "healthStatus", "locationId", "contaminationType", "contaminationDate", "disposalReason"];

    for (const [key, value] of Object.entries(previousState)) {
      if (allowedFields.includes(key)) {
        updateData[key] = value;
      }
    }

    // For dispose undo, also clear the disposal reason
    if (lastActivity.type === "disposed" && !updateData.disposalReason) {
      updateData.disposalReason = null;
    }

    if (Object.keys(updateData).length === 0) {
      throw new ApiError("Cannot undo: no fields to restore", 400);
    }

    // Apply the undo
    const updated = await prisma.vessel.update({
      where: { id },
      data: updateData,
      include: { cultivar: true, location: true, mediaRecipe: true },
    });

    await logActivity({
      vesselId: id,
      userId: user.id,
      type: "updated",
      category: "vessel",
      previousState: { action: lastActivity.type },
      newState: updateData,
      notes: `Undo: reversed "${lastActivity.type.replace(/_/g, " ")}"`,
    });

    return NextResponse.json(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
