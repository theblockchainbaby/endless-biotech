import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/api-helpers";
import { STAGES } from "@/lib/constants";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const orgId = user.organizationId;
    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "month";

    const now = new Date();
    let startDate: Date;

    switch (period) {
      case "week":
        startDate = new Date(now.getTime() - 7 * 86400000);
        break;
      case "quarter":
        startDate = new Date(now.getTime() - 90 * 86400000);
        break;
      case "year":
        startDate = new Date(now.getTime() - 365 * 86400000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 86400000);
        break;
    }

    const activeFilter = {
      organizationId: orgId,
      status: { notIn: ["multiplied", "disposed"] },
    };

    const [
      activities,
      allVessels,
      cultivarStats,
      contaminatedByCultivar,
      contaminationByType,
      vesselsByStage,
      totalCreatedAllTime,
    ] = await Promise.all([
      // All activities in period
      prisma.activity.findMany({
        where: {
          vessel: { organizationId: orgId },
          createdAt: { gte: startDate },
        },
        select: {
          type: true,
          createdAt: true,
          vesselId: true,
          previousState: true,
          newState: true,
        },
        orderBy: { createdAt: "asc" },
      }),

      // All active vessels with cultivar info
      prisma.vessel.findMany({
        where: activeFilter,
        select: {
          id: true,
          cultivarId: true,
          stage: true,
          healthStatus: true,
          generation: true,
          contaminationType: true,
          plantedAt: true,
          createdAt: true,
        },
      }),

      // Cultivar-level stats
      prisma.cultivar.findMany({
        where: { organizationId: orgId },
        select: {
          id: true,
          name: true,
          _count: { select: { vessels: true } },
        },
      }),

      // Contaminated vessels grouped by cultivar
      prisma.vessel.groupBy({
        by: ["cultivarId"],
        _count: { id: true },
        where: {
          organizationId: orgId,
          contaminationType: { not: null },
          cultivarId: { not: null },
        },
      }),

      // Contamination by type
      prisma.vessel.groupBy({
        by: ["contaminationType"],
        _count: { id: true },
        where: {
          organizationId: orgId,
          contaminationType: { not: null },
        },
      }),

      // All vessels by stage (including disposed/multiplied for funnel)
      prisma.vessel.groupBy({
        by: ["stage"],
        _count: { id: true },
        where: { organizationId: orgId },
      }),

      // Total vessels ever created in org
      prisma.vessel.count({ where: { organizationId: orgId } }),
    ]);

    // ── Production Throughput (daily trends) ──
    const trendMap = new Map<string, { created: number; multiplied: number; disposed: number; contaminated: number; stage_advanced: number }>();
    const dateKey = (d: Date) => d.toISOString().split("T")[0];

    for (let d = new Date(startDate); d <= now; d.setDate(d.getDate() + 1)) {
      trendMap.set(dateKey(d), { created: 0, multiplied: 0, disposed: 0, contaminated: 0, stage_advanced: 0 });
    }

    for (const a of activities) {
      const key = dateKey(a.createdAt);
      const entry = trendMap.get(key);
      if (entry && a.type in entry) {
        (entry as Record<string, number>)[a.type]++;
      }
    }

    const productionTrends = Array.from(trendMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, counts]) => ({ date, ...counts }));

    // ── Contamination Rate & Trend (weekly buckets) ──
    const totalActive = allVessels.length;
    const totalContaminated = allVessels.filter((v) => v.contaminationType !== null).length;
    const contaminationRate = totalActive > 0 ? Math.round((totalContaminated / totalActive) * 1000) / 10 : 0;

    // Weekly contamination trend
    const weekBuckets = new Map<string, { total: number; contaminated: number }>();
    const contaminationActivities = activities.filter((a) => a.type === "contaminated");
    const creationActivities = activities.filter((a) => a.type === "created");

    // Group by week
    for (let d = new Date(startDate); d <= now; d.setDate(d.getDate() + 7)) {
      const weekStart = dateKey(d);
      weekBuckets.set(weekStart, { total: 0, contaminated: 0 });
    }

    for (const a of creationActivities) {
      const weekKey = getWeekKey(a.createdAt, startDate);
      const bucket = weekBuckets.get(weekKey);
      if (bucket) bucket.total++;
    }

    for (const a of contaminationActivities) {
      const weekKey = getWeekKey(a.createdAt, startDate);
      const bucket = weekBuckets.get(weekKey);
      if (bucket) bucket.contaminated++;
    }

    const contaminationTrend = Array.from(weekBuckets.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([week, data]) => ({
        week,
        rate: data.total > 0 ? Math.round((data.contaminated / data.total) * 1000) / 10 : 0,
        count: data.contaminated,
      }));

    // ── Multiplication Rate ──
    const multiplicationEvents = activities.filter((a) => a.type === "multiplied").length;
    const multiplicationRate = totalActive > 0 ? Math.round((multiplicationEvents / totalActive) * 1000) / 10 : 0;

    // ── Cultivar Performance ──
    const contaminatedMap = new Map<string, number>();
    for (const c of contaminatedByCultivar) {
      if (c.cultivarId) contaminatedMap.set(c.cultivarId, c._count.id);
    }

    const cultivarVesselMap = new Map<string, typeof allVessels>();
    for (const v of allVessels) {
      if (!v.cultivarId) continue;
      const list = cultivarVesselMap.get(v.cultivarId) || [];
      list.push(v);
      cultivarVesselMap.set(v.cultivarId, list);
    }

    // Count multiplication events per cultivar
    const multiEventsByCultivar = new Map<string, number>();
    for (const a of activities) {
      if (a.type !== "multiplied") continue;
      // Find the vessel's cultivarId
      const vessel = allVessels.find((v) => v.id === a.vesselId);
      if (vessel?.cultivarId) {
        multiEventsByCultivar.set(vessel.cultivarId, (multiEventsByCultivar.get(vessel.cultivarId) || 0) + 1);
      }
    }

    const cultivarPerformance = cultivarStats
      .map((c) => {
        const vessels = cultivarVesselMap.get(c.id) || [];
        const activeCount = vessels.length;
        const contaminated = contaminatedMap.get(c.id) || 0;
        const avgGeneration = vessels.length > 0
          ? Math.round((vessels.reduce((sum, v) => sum + v.generation, 0) / vessels.length) * 10) / 10
          : 0;
        const byStage: Record<string, number> = {};
        for (const v of vessels) {
          byStage[v.stage] = (byStage[v.stage] || 0) + 1;
        }

        return {
          id: c.id,
          name: c.name,
          totalVessels: c._count.vessels,
          activeVessels: activeCount,
          contaminated,
          contaminationRate: c._count.vessels > 0 ? Math.round((contaminated / c._count.vessels) * 1000) / 10 : 0,
          avgGeneration,
          multiplicationEvents: multiEventsByCultivar.get(c.id) || 0,
          byStage,
        };
      })
      .sort((a, b) => b.activeVessels - a.activeVessels);

    // ── Survival Funnel ──
    // Count how many vessels currently exist at each stage or beyond
    const stageOrder = STAGES as readonly string[];
    const stageCountMap = new Map<string, number>();
    for (const s of vesselsByStage) {
      stageCountMap.set(s.stage, s._count.id);
    }

    // Funnel: count vessels at or past each stage
    const survivalFunnel = stageOrder.map((stage, idx) => {
      // Vessels at this stage or any later stage
      let count = 0;
      for (let i = idx; i < stageOrder.length; i++) {
        count += stageCountMap.get(stageOrder[i]) || 0;
      }
      // Also include multiplied/disposed that passed through this stage
      // For simplicity, use total created as base and degrade by stage
      return {
        stage,
        count,
        pct: totalCreatedAllTime > 0 ? Math.round((count / totalCreatedAllTime) * 100) : 0,
      };
    });

    // ── Cycle Time (avg days from planted to each stage advance) ──
    const stageAdvances = activities.filter((a) => a.type === "stage_advanced");
    const cycleTimeByStage = new Map<string, number[]>();

    for (const a of stageAdvances) {
      const newState = a.newState as Record<string, unknown> | null;
      const prevState = a.previousState as Record<string, unknown> | null;
      if (!newState?.stage) continue;

      const toStage = newState.stage as string;
      // Look for this vessel's planted date
      const vessel = allVessels.find((v) => v.id === a.vesselId);
      if (vessel?.plantedAt) {
        const days = Math.round((a.createdAt.getTime() - new Date(vessel.plantedAt).getTime()) / 86400000);
        if (days >= 0 && days < 365) {
          const list = cycleTimeByStage.get(toStage) || [];
          list.push(days);
          cycleTimeByStage.set(toStage, list);
        }
      }
    }

    const cycleTime = stageOrder.slice(1).map((stage) => {
      const times = cycleTimeByStage.get(stage) || [];
      const avg = times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;
      return { stage, avgDays: avg, samples: times.length };
    });

    // ── Health Distribution ──
    const healthCounts: Record<string, number> = {};
    for (const v of allVessels) {
      healthCounts[v.healthStatus] = (healthCounts[v.healthStatus] || 0) + 1;
    }
    const healthDistribution = Object.entries(healthCounts)
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({
      period,
      startDate: startDate.toISOString(),
      endDate: now.toISOString(),
      // Overview KPIs
      totalActive,
      totalContaminated,
      contaminationRate,
      multiplicationRate,
      multiplicationEvents,
      totalCreated: totalCreatedAllTime,
      // Trends
      productionTrends,
      contaminationTrend,
      // Cultivar
      cultivarPerformance,
      // Production
      survivalFunnel,
      cycleTime,
      // Quality
      contaminationByType: contaminationByType.map((c) => ({
        type: c.contaminationType || "unknown",
        count: c._count.id,
      })),
      healthDistribution,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

function getWeekKey(date: Date, periodStart: Date): string {
  const diffDays = Math.floor((date.getTime() - periodStart.getTime()) / 86400000);
  const weekOffset = Math.floor(diffDays / 7) * 7;
  const weekStart = new Date(periodStart.getTime() + weekOffset * 86400000);
  return weekStart.toISOString().split("T")[0];
}
