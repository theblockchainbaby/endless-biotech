import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "week"; // today, week, biweek, month, custom
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const userId = searchParams.get("userId"); // for individual drilldown

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    if (from && to) {
      startDate = new Date(from);
      endDate = new Date(to);
    } else {
      switch (period) {
        case "today":
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case "biweek":
          startDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
          break;
        case "month":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        default: // week
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }
    }

    const orgId = user.organizationId;

    // Get incentive config
    const config = await prisma.incentiveConfig.findUnique({
      where: { organizationId: orgId },
    });
    const pointDollarValue = config?.pointDollarValue ?? 0.025;
    const baseHourlyRate = config?.baseHourlyRate ?? 16.0;
    const contaminationThreshold = config?.contaminationThreshold ?? 5.0;
    const dailyVesselTarget = config?.dailyVesselTarget ?? null;

    // Get all point rules
    const pointRules = await prisma.incentivePointRule.findMany({
      where: { organizationId: orgId, isActive: true },
    });

    // Get techs (filter to specific user if drilldown)
    const techWhere: Record<string, unknown> = {
      organizationId: orgId,
      isActive: true,
    };
    if (userId) techWhere.id = userId;

    const techs = await prisma.user.findMany({
      where: techWhere,
      select: { id: true, name: true, email: true, role: true },
    });

    // Get all production activities in the date range
    const productionTypes = ["initiate", "multiply", "advance", "subculture", "transfer"];
    const contaminationTypes = ["contamination", "dispose"];

    const [productionActivities, contaminationActivities, shifts] = await Promise.all([
      prisma.activity.findMany({
        where: {
          userId: { in: techs.map((t) => t.id) },
          type: { in: productionTypes },
          createdAt: { gte: startDate, lte: endDate },
        },
        include: {
          vessel: { select: { stage: true, cultivarId: true } },
        },
      }),
      prisma.activity.findMany({
        where: {
          userId: { in: techs.map((t) => t.id) },
          type: { in: contaminationTypes },
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      prisma.techShift.findMany({
        where: {
          organizationId: orgId,
          userId: { in: techs.map((t) => t.id) },
          clockIn: { gte: startDate, lte: endDate },
        },
        include: {
          station: { select: { id: true, name: true } },
        },
      }),
    ]);

    // Calculate per-tech performance
    const techPerformance = techs.map((tech) => {
      const techProduction = productionActivities.filter((a) => a.userId === tech.id);
      const techContamination = contaminationActivities.filter((a) => a.userId === tech.id);
      const techShifts = shifts.filter((s) => s.userId === tech.id);

      // Calculate points
      let totalPoints = 0;
      const taskBreakdown: Record<string, { count: number; points: number; stage: string; cultivarId: string | null }> = {};

      for (const act of techProduction) {
        const stage = act.vessel?.stage || "multiplication";
        const cultivarId = act.vessel?.cultivarId || null;

        const rule =
          pointRules.find((r) => r.stage === stage && r.cultivarId === cultivarId) ||
          pointRules.find((r) => r.stage === stage && !r.cultivarId);

        const pts = rule?.basePoints ?? 1;
        totalPoints += pts;

        const key = `${stage}:${act.type}`;
        if (!taskBreakdown[key]) {
          taskBreakdown[key] = { count: 0, points: 0, stage, cultivarId };
        }
        taskBreakdown[key].count++;
        taskBreakdown[key].points += pts;
      }

      // Calculate hours from completed shifts
      const totalHours = techShifts.reduce((sum, s) => sum + (s.hoursWorked || 0), 0);
      const overtimeHours = techShifts.filter((s) => s.isOvertime).reduce((sum, s) => sum + (s.hoursWorked || 0), 0);

      // If no shifts logged, estimate from activity timestamps
      let effectiveHours = totalHours;
      if (effectiveHours === 0 && techProduction.length > 0) {
        const dates = techProduction.map((a) => a.createdAt.getTime());
        const days = new Set(techProduction.map((a) => a.createdAt.toISOString().split("T")[0]));
        effectiveHours = days.size * 8; // assume 8hr days if no clock-in data
      }

      const vesselsProcessed = techProduction.length;
      const contaminationCount = techContamination.length;
      const contaminationRate = vesselsProcessed > 0
        ? Math.round((contaminationCount / vesselsProcessed) * 10000) / 100
        : 0;

      const effectiveRate = effectiveHours > 0
        ? Math.round((totalPoints * pointDollarValue) / effectiveHours * 100) / 100
        : 0;

      const bonusAmount = effectiveHours > 0
        ? Math.round(Math.max(0, effectiveRate - baseHourlyRate) * effectiveHours * 100) / 100
        : 0;

      const bonusEligible = contaminationRate <= contaminationThreshold && effectiveRate > baseHourlyRate;

      return {
        user: tech,
        vesselsProcessed,
        totalPoints: Math.round(totalPoints * 100) / 100,
        totalHours: Math.round(effectiveHours * 100) / 100,
        overtimeHours: Math.round(overtimeHours * 100) / 100,
        contaminationCount,
        contaminationRate,
        effectiveRate,
        bonusAmount: bonusEligible ? bonusAmount : 0,
        bonusEligible,
        status: !bonusEligible && contaminationRate > contaminationThreshold
          ? "over_contamination"
          : !bonusEligible
          ? "below_minimum"
          : "eligible",
        taskBreakdown: Object.entries(taskBreakdown).map(([key, val]) => ({
          key,
          ...val,
        })),
        shifts: techShifts.map((s) => ({
          id: s.id,
          clockIn: s.clockIn,
          clockOut: s.clockOut,
          hoursWorked: s.hoursWorked,
          station: s.station,
          totalPoints: s.totalPoints,
          vesselsProcessed: s.vesselsProcessed,
          effectiveRate: s.effectiveRate,
          bonusAmount: s.bonusAmount,
          isOvertime: s.isOvertime,
        })),
      };
    });

    // Sort by total points descending (ranking)
    techPerformance.sort((a, b) => b.totalPoints - a.totalPoints);

    // Team aggregates
    const teamTotals = {
      totalVessels: techPerformance.reduce((s, t) => s + t.vesselsProcessed, 0),
      totalPoints: techPerformance.reduce((s, t) => s + t.totalPoints, 0),
      totalHours: techPerformance.reduce((s, t) => s + t.totalHours, 0),
      avgEffectiveRate:
        techPerformance.length > 0
          ? Math.round(
              (techPerformance.reduce((s, t) => s + t.effectiveRate, 0) / techPerformance.length) * 100
            ) / 100
          : 0,
      avgContaminationRate:
        techPerformance.length > 0
          ? Math.round(
              (techPerformance.reduce((s, t) => s + t.contaminationRate, 0) / techPerformance.length) * 100
            ) / 100
          : 0,
      totalBonusPool: techPerformance.reduce((s, t) => s + t.bonusAmount, 0),
      eligibleCount: techPerformance.filter((t) => t.bonusEligible).length,
      techCount: techPerformance.length,
    };

    // Station contamination correlation
    const stationStats: Record<string, { name: string; vessels: number; contamination: number }> = {};
    for (const s of shifts) {
      if (!s.station) continue;
      if (!stationStats[s.station.id]) {
        stationStats[s.station.id] = { name: s.station.name, vessels: 0, contamination: 0 };
      }
      stationStats[s.station.id].vessels += s.vesselsProcessed;
      stationStats[s.station.id].contamination += s.contaminationCount;
    }

    // Media batch contamination correlation
    const contaminatedVessels = await prisma.vessel.findMany({
      where: {
        organizationId: orgId,
        contaminationDate: { gte: startDate, lte: endDate },
        mediaBatchId: { not: null },
      },
      select: { mediaBatchId: true },
    });

    const batchContamCounts: Record<string, number> = {};
    for (const v of contaminatedVessels) {
      if (v.mediaBatchId) {
        batchContamCounts[v.mediaBatchId] = (batchContamCounts[v.mediaBatchId] || 0) + 1;
      }
    }

    // Get batch details for any with >1 contamination
    const flaggedBatchIds = Object.entries(batchContamCounts)
      .filter(([, count]) => count > 1)
      .map(([id]) => id);

    const flaggedBatches = flaggedBatchIds.length > 0
      ? await prisma.mediaBatch.findMany({
          where: { id: { in: flaggedBatchIds } },
          select: { id: true, batchNumber: true, recipeId: true, createdAt: true },
        })
      : [];

    return NextResponse.json({
      period: { from: startDate, to: endDate, type: period },
      config: {
        baseHourlyRate,
        pointDollarValue,
        contaminationThreshold,
        dailyVesselTarget,
        bonusPeriod: config?.bonusPeriod ?? "weekly",
        enableIncentives: config?.enableIncentives ?? true,
      },
      team: teamTotals,
      technicians: techPerformance,
      stations: Object.entries(stationStats).map(([id, stats]) => ({
        id,
        ...stats,
        contaminationRate:
          stats.vessels > 0
            ? Math.round((stats.contamination / stats.vessels) * 10000) / 100
            : 0,
      })),
      flaggedMediaBatches: flaggedBatches.map((b) => ({
        ...b,
        contaminationCount: batchContamCounts[b.id],
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
