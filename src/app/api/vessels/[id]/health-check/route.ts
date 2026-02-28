import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError, parseBody } from "@/lib/api-helpers";
import { healthCheckSchema } from "@/lib/validations";
import { logActivity } from "@/lib/activity-logger";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await parseBody(req, healthCheckSchema);

    const vessel = await prisma.vessel.findFirst({
      where: { id, organizationId: user.organizationId },
    });
    if (!vessel) return NextResponse.json({ error: "Vessel not found" }, { status: 404 });

    const previousState = {
      healthStatus: vessel.healthStatus,
      contaminationType: vessel.contaminationType,
    };

    const data: Record<string, unknown> = {
      healthStatus: body.healthStatus,
    };

    if (body.contaminationType !== undefined) {
      data.contaminationType = body.contaminationType;
    }

    if (body.healthStatus === "contaminated" && !vessel.contaminationDate) {
      data.contaminationDate = new Date();
    }

    if (body.healthStatus === "dead") {
      data.status = "disposed";
      data.disposalReason = "Dead — health check";
    }

    const updated = await prisma.vessel.update({
      where: { id },
      data,
      include: { cultivar: true, location: true },
    });

    await logActivity({
      vesselId: id,
      userId: user.id,
      type: body.healthStatus === "contaminated" ? "contaminated" : "health_update",
      category: "vessel",
      previousState,
      newState: { healthStatus: body.healthStatus, contaminationType: body.contaminationType ?? null },
      notes: body.notes || `Health updated to ${body.healthStatus}`,
    });

    return NextResponse.json(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
