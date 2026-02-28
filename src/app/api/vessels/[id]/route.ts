import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireRole, handleApiError, parseBody } from "@/lib/api-helpers";
import { updateVesselSchema } from "@/lib/validations";
import { logActivity, buildStateSnapshot } from "@/lib/activity-logger";

const TRACKED_FIELDS = ["status", "stage", "healthStatus", "cultivarId", "mediaRecipeId", "locationId", "explantCount"];

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const vessel = await prisma.vessel.findFirst({
      where: { id, organizationId: user.organizationId },
      include: {
        cultivar: true,
        location: true,
        mediaRecipe: { include: { components: true } },
        parentVessel: { select: { id: true, barcode: true } },
        childVessels: { include: { cultivar: true }, orderBy: { createdAt: "desc" } },
        activities: { include: { user: { select: { id: true, name: true } } }, orderBy: { createdAt: "desc" } },
        photos: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!vessel) return NextResponse.json({ error: "Vessel not found" }, { status: 404 });
    return NextResponse.json(vessel);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await parseBody(req, updateVesselSchema);

    const existing = await prisma.vessel.findFirst({
      where: { id, organizationId: user.organizationId },
    });
    if (!existing) return NextResponse.json({ error: "Vessel not found" }, { status: 404 });

    const previousState = buildStateSnapshot(existing as unknown as Record<string, unknown>, TRACKED_FIELDS);

    const data: Record<string, unknown> = {};
    if (body.cultivarId !== undefined) data.cultivarId = body.cultivarId;
    if (body.mediaRecipeId !== undefined) data.mediaRecipeId = body.mediaRecipeId;
    if (body.locationId !== undefined) data.locationId = body.locationId;
    if (body.explantCount !== undefined) data.explantCount = body.explantCount;
    if (body.healthStatus !== undefined) data.healthStatus = body.healthStatus;
    if (body.status !== undefined) data.status = body.status;
    if (body.stage !== undefined) data.stage = body.stage;
    if (body.contaminationType !== undefined) data.contaminationType = body.contaminationType;
    if (body.contaminationDate !== undefined) data.contaminationDate = body.contaminationDate ? new Date(body.contaminationDate) : null;
    if (body.disposalReason !== undefined) data.disposalReason = body.disposalReason;
    if (body.notes !== undefined) data.notes = body.notes;

    const vessel = await prisma.vessel.update({
      where: { id },
      data,
      include: { cultivar: true, location: true, mediaRecipe: true },
    });

    const newState = buildStateSnapshot(vessel as unknown as Record<string, unknown>, TRACKED_FIELDS);

    let activityType = "updated";
    if (body.status) activityType = body.status;
    else if (body.healthStatus) activityType = "health_update";
    else if (body.stage) activityType = "stage_advanced";
    else if (body.locationId) activityType = "location_changed";

    await logActivity({
      vesselId: id,
      userId: user.id,
      type: activityType,
      category: "vessel",
      previousState,
      newState,
      notes: body.notes || undefined,
    });

    return NextResponse.json(vessel);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    requireRole(user, "admin", "manager");
    const { id } = await params;

    const vessel = await prisma.vessel.findFirst({
      where: { id, organizationId: user.organizationId },
    });
    if (!vessel) return NextResponse.json({ error: "Vessel not found" }, { status: 404 });

    await prisma.vessel.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
