import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError, parseBody } from "@/lib/api-helpers";
import { batchOperationSchema } from "@/lib/validations";
import { logActivity } from "@/lib/activity-logger";
import { sendBatchDisposeAlert } from "@/lib/email";
import { STAGES, DEFAULT_SUBCULTURE_INTERVAL_DAYS } from "@/lib/constants";

const stageOrder = STAGES;

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await parseBody(req, batchOperationSchema);

    const vessels = await prisma.vessel.findMany({
      where: { id: { in: body.vesselIds }, organizationId: user.organizationId },
    });

    if (vessels.length === 0) {
      return NextResponse.json({ error: "No matching vessels found" }, { status: 404 });
    }

    const results: { id: string; barcode: string; success: boolean; error?: string }[] = [];

    for (const vessel of vessels) {
      try {
        switch (body.action) {
          case "advance_stage": {
            const currentIndex = stageOrder.indexOf(vessel.stage as typeof stageOrder[number]);
            if (currentIndex === -1 || currentIndex >= stageOrder.length - 1) {
              results.push({ id: vessel.id, barcode: vessel.barcode, success: false, error: "Cannot advance past final stage" });
              continue;
            }
            const nextStage = stageOrder[currentIndex + 1];
            const data: Record<string, unknown> = { stage: nextStage };
            if (nextStage === "multiplication") {
              const nextDate = new Date();
              nextDate.setDate(nextDate.getDate() + DEFAULT_SUBCULTURE_INTERVAL_DAYS);
              data.nextSubcultureDate = nextDate;
              data.plantedAt = new Date();
            }
            await prisma.vessel.update({ where: { id: vessel.id }, data });
            await logActivity({
              vesselId: vessel.id,
              userId: user.id,
              type: "stage_advanced",
              category: "vessel",
              previousState: { stage: vessel.stage },
              newState: { stage: nextStage },
              notes: `Batch: advanced from ${vessel.stage} to ${nextStage}`,
            });
            results.push({ id: vessel.id, barcode: vessel.barcode, success: true });
            break;
          }
          case "move": {
            const locationId = body.params?.locationId as string;
            if (!locationId) {
              results.push({ id: vessel.id, barcode: vessel.barcode, success: false, error: "Location required" });
              continue;
            }
            await prisma.vessel.update({ where: { id: vessel.id }, data: { locationId } });
            await logActivity({
              vesselId: vessel.id,
              userId: user.id,
              type: "location_changed",
              category: "vessel",
              notes: `Batch move`,
            });
            results.push({ id: vessel.id, barcode: vessel.barcode, success: true });
            break;
          }
          case "health_check": {
            const healthStatus = (body.params?.healthStatus as string) || "healthy";
            await prisma.vessel.update({ where: { id: vessel.id }, data: { healthStatus } });
            await logActivity({
              vesselId: vessel.id,
              userId: user.id,
              type: "health_update",
              category: "vessel",
              previousState: { healthStatus: vessel.healthStatus },
              newState: { healthStatus },
              notes: `Batch health check`,
            });
            results.push({ id: vessel.id, barcode: vessel.barcode, success: true });
            break;
          }
          case "dispose": {
            const reason = (body.params?.reason as string) || "Batch disposal";
            await prisma.vessel.update({
              where: { id: vessel.id },
              data: { status: "disposed", disposalReason: reason },
            });
            await logActivity({
              vesselId: vessel.id,
              userId: user.id,
              type: "disposed",
              category: "vessel",
              notes: reason,
            });
            results.push({ id: vessel.id, barcode: vessel.barcode, success: true });
            break;
          }
        }
      } catch {
        results.push({ id: vessel.id, barcode: vessel.barcode, success: false, error: "Operation failed" });
      }
    }

    const successCount = results.filter((r) => r.success).length;

    // Send email alert for batch disposal
    if (body.action === "dispose" && successCount > 0) {
      const managers = await prisma.user.findMany({
        where: {
          organizationId: user.organizationId,
          role: { in: ["admin", "manager"] },
          isActive: true,
        },
        select: { email: true },
      });
      if (managers.length > 0) {
        sendBatchDisposeAlert({
          vesselCount: successCount,
          disposedBy: user.name,
          reason: (body.params?.reason as string) || "Batch disposal",
          recipientEmails: managers.map((m) => m.email),
        }).catch(() => {});
      }
    }

    return NextResponse.json({ results, total: vessels.length, success: successCount, failed: vessels.length - successCount });
  } catch (error) {
    return handleApiError(error);
  }
}
