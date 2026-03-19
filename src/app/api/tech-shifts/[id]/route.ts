import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAuth, handleApiError, ApiError } from "@/lib/api-helpers";
import { z } from "zod";

const updateShiftSchema = z.object({
  stationId: z.string().nullable().optional(),
  isOvertime: z.boolean().optional(),
  notes: z.string().nullable().optional(),
  status: z.enum(["active", "completed", "void"]).optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const shift = await prisma.techShift.findFirst({
      where: { id, organizationId: user.organizationId },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        station: { select: { id: true, name: true, type: true } },
      },
    });
    if (!shift) throw new ApiError("Shift not found", 404);
    return NextResponse.json(shift);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = updateShiftSchema.parse(await req.json());

    const shift = await prisma.techShift.findFirst({
      where: { id, organizationId: user.organizationId },
    });
    if (!shift) throw new ApiError("Shift not found", 404);

    // If completing (clocking out), calculate hours and performance
    const updateData: Record<string, unknown> = { ...body };

    if (body.status === "completed" && shift.status === "active") {
      const clockOut = new Date();
      const hoursWorked = (clockOut.getTime() - shift.clockIn.getTime()) / (1000 * 60 * 60);

      // Count vessels processed during this shift
      const vesselActivities = await prisma.activity.count({
        where: {
          userId: shift.userId,
          type: { in: ["initiate", "multiply", "advance", "subculture", "transfer"] },
          createdAt: { gte: shift.clockIn, lte: clockOut },
        },
      });

      // Count contamination flagged to vessels this tech created during the shift
      const contaminationCount = await prisma.activity.count({
        where: {
          userId: shift.userId,
          type: { in: ["contamination", "dispose"] },
          createdAt: { gte: shift.clockIn, lte: clockOut },
        },
      });

      // Calculate points from point rules
      const totalPoints = await calculateShiftPoints(
        shift.userId,
        shift.organizationId,
        shift.clockIn,
        clockOut
      );

      // Get incentive config for rate calculation
      const config = await prisma.incentiveConfig.findUnique({
        where: { organizationId: shift.organizationId },
      });

      const pointDollarValue = config?.pointDollarValue ?? 0.025;
      const baseHourlyRate = config?.baseHourlyRate ?? 16.0;
      const effectiveRate = hoursWorked > 0 ? (totalPoints * pointDollarValue) / hoursWorked : 0;
      const bonusAmount = Math.max(0, effectiveRate - baseHourlyRate) * hoursWorked;

      updateData.clockOut = clockOut;
      updateData.hoursWorked = Math.round(hoursWorked * 100) / 100;
      updateData.vesselsProcessed = vesselActivities;
      updateData.contaminationCount = contaminationCount;
      updateData.totalPoints = totalPoints;
      updateData.effectiveRate = Math.round(effectiveRate * 100) / 100;
      updateData.bonusAmount = Math.round(bonusAmount * 100) / 100;
    }

    const updated = await prisma.techShift.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        station: { select: { id: true, name: true, type: true } },
      },
    });
    return NextResponse.json(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

async function calculateShiftPoints(
  userId: string,
  organizationId: string,
  from: Date,
  to: Date
): Promise<number> {
  // Get all vessel activities for this user during the shift
  const activities = await prisma.activity.findMany({
    where: {
      userId,
      type: { in: ["initiate", "multiply", "advance", "subculture", "transfer"] },
      createdAt: { gte: from, lte: to },
    },
    include: {
      vessel: {
        select: { stage: true, cultivarId: true },
      },
    },
  });

  // Get all point rules for this org
  const rules = await prisma.incentivePointRule.findMany({
    where: { organizationId, isActive: true },
  });

  let totalPoints = 0;
  for (const act of activities) {
    const stage = act.vessel?.stage || "multiplication";
    const cultivarId = act.vessel?.cultivarId;

    // Look for cultivar-specific rule first, then generic
    const rule =
      rules.find(
        (r) => r.stage === stage && r.cultivarId === cultivarId
      ) ||
      rules.find(
        (r) => r.stage === stage && !r.cultivarId
      );

    totalPoints += rule?.basePoints ?? 1;
  }

  return totalPoints;
}
