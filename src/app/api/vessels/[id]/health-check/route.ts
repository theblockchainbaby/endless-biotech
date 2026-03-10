import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError, parseBody } from "@/lib/api-helpers";
import { healthCheckSchema } from "@/lib/validations";
import { logActivity } from "@/lib/activity-logger";
import { sendContaminationAlert } from "@/lib/email";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await parseBody(req, healthCheckSchema);

    const vessel = await prisma.vessel.findFirst({
      where: { id, organizationId: user.organizationId },
    });
    if (!vessel) return NextResponse.json({ error: "Vessel not found. It may have been deleted or belongs to another organization." }, { status: 404 });

    if (vessel.status === "disposed") {
      return NextResponse.json({ error: "Cannot update health on a disposed vessel." }, { status: 400 });
    }

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

    const isContaminated = !!body.contaminationType;
    if (isContaminated && !vessel.contaminationDate) {
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
      type: isContaminated ? "contaminated" : "health_update",
      category: "vessel",
      previousState,
      newState: { healthStatus: body.healthStatus, contaminationType: body.contaminationType ?? null },
      notes: body.notes || `Health updated to ${body.healthStatus}`,
    });

    // Create alert + send email for contamination
    if (isContaminated) {
      // Persist alert to database
      await prisma.alert.create({
        data: {
          type: "contamination_spike",
          severity: "warning",
          title: `Contamination: ${vessel.barcode}`,
          message: `${body.contaminationType || "Unknown"} contamination detected on vessel ${vessel.barcode} by ${user.name}.`,
          entityType: "vessel",
          entityId: vessel.id,
          organizationId: user.organizationId,
        },
      });

      const managers = await prisma.user.findMany({
        where: {
          organizationId: user.organizationId,
          role: { in: ["admin", "manager", "lead_tech"] },
          isActive: true,
        },
        select: { email: true },
      });
      if (managers.length > 0) {
        sendContaminationAlert({
          vesselBarcode: vessel.barcode,
          contaminationType: body.contaminationType || "unknown",
          detectedBy: user.name,
          recipientEmails: managers.map((m) => m.email),
        }).catch(() => {}); // Fire and forget — don't block the response
      }
    }

    return NextResponse.json(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
