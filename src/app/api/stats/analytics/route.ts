import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const orgId = user.organizationId;
    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "month"; // week, month, quarter

    const now = new Date();
    let startDate: Date;
    let intervalDays: number;

    switch (period) {
      case "week":
        startDate = new Date(now.getTime() - 7 * 86400000);
        intervalDays = 1;
        break;
      case "quarter":
        startDate = new Date(now.getTime() - 90 * 86400000);
        intervalDays = 7;
        break;
      default: // month
        startDate = new Date(now.getTime() - 30 * 86400000);
        intervalDays = 1;
        break;
    }

    const activeFilter = {
      organizationId: orgId,
      status: { notIn: ["multiplied", "disposed"] },
    };

    const [
      activities,
      contaminationByType,
      contaminationByCultivar,
      locationCapacity,
      weeklyCreations,
      weeklyMultiplications,
      weeklyDisposals,
    ] = await Promise.all([
      // Activities in period for trend data
      prisma.activity.findMany({
        where: {
          vessel: { organizationId: orgId },
          createdAt: { gte: startDate },
        },
        select: {
          type: true,
          createdAt: true,
        },
        orderBy: { createdAt: "asc" },
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

      // Contamination by cultivar
      prisma.vessel.groupBy({
        by: ["cultivarId"],
        _count: { id: true },
        where: {
          organizationId: orgId,
          contaminationType: { not: null },
          cultivarId: { not: null },
        },
      }),

      // Location capacity
      prisma.location.findMany({
        where: {
          site: { organizationId: orgId },
          isActive: true,
          capacity: { not: null },
        },
        select: {
          id: true,
          name: true,
          type: true,
          capacity: true,
          _count: { select: { vessels: true } },
        },
        orderBy: { name: "asc" },
      }),

      // Weekly creation counts
      prisma.activity.groupBy({
        by: ["createdAt"],
        _count: { id: true },
        where: {
          vessel: { organizationId: orgId },
          type: "created",
          createdAt: { gte: startDate },
        },
      }),

      // Weekly multiplication counts
      prisma.activity.groupBy({
        by: ["createdAt"],
        _count: { id: true },
        where: {
          vessel: { organizationId: orgId },
          type: "multiplied",
          createdAt: { gte: startDate },
        },
      }),

      // Weekly disposal counts
      prisma.activity.groupBy({
        by: ["createdAt"],
        _count: { id: true },
        where: {
          vessel: { organizationId: orgId },
          type: "disposed",
          createdAt: { gte: startDate },
        },
      }),
    ]);

    // Build daily trend data
    const trendMap = new Map<string, { created: number; multiplied: number; disposed: number; contaminated: number; stage_advanced: number }>();
    const dateKey = (d: Date) => d.toISOString().split("T")[0];

    // Initialize all days in the period
    for (let d = new Date(startDate); d <= now; d.setDate(d.getDate() + intervalDays)) {
      trendMap.set(dateKey(d), { created: 0, multiplied: 0, disposed: 0, contaminated: 0, stage_advanced: 0 });
    }

    // Fill in activity counts
    for (const a of activities) {
      const key = dateKey(a.createdAt);
      const entry = trendMap.get(key);
      if (entry && a.type in entry) {
        (entry as Record<string, number>)[a.type]++;
      }
    }

    const growthTrends = Array.from(trendMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, counts]) => ({ date, ...counts }));

    // Resolve cultivar names for contamination
    const contCultivarIds = contaminationByCultivar
      .map((c) => c.cultivarId)
      .filter((id): id is string => id !== null);
    const contCultivars = contCultivarIds.length > 0
      ? await prisma.cultivar.findMany({ where: { id: { in: contCultivarIds } } })
      : [];
    const contCultivarMap = Object.fromEntries(contCultivars.map((c) => [c.id, c.name]));

    // Contamination rate: contaminated / total active
    const totalActive = await prisma.vessel.count({ where: activeFilter });
    const totalContaminated = await prisma.vessel.count({
      where: { ...activeFilter, contaminationType: { not: null } },
    });
    const contaminationRate = totalActive > 0 ? (totalContaminated / totalActive) * 100 : 0;

    // Multiplication rate: multiplied activities this period / active vessels
    const multiplicationEvents = activities.filter((a) => a.type === "multiplied").length;
    const multiplicationRate = totalActive > 0 ? (multiplicationEvents / totalActive) * 100 : 0;

    return NextResponse.json({
      period,
      startDate: startDate.toISOString(),
      endDate: now.toISOString(),
      contaminationRate: Math.round(contaminationRate * 10) / 10,
      multiplicationRate: Math.round(multiplicationRate * 10) / 10,
      growthTrends,
      contaminationByType: contaminationByType.map((c) => ({
        type: c.contaminationType,
        count: c._count.id,
      })),
      contaminationByCultivar: contaminationByCultivar.map((c) => ({
        cultivar: c.cultivarId ? contCultivarMap[c.cultivarId] || "Unknown" : "Unknown",
        count: c._count.id,
      })),
      locationCapacity: locationCapacity.map((l) => ({
        id: l.id,
        name: l.name,
        type: l.type,
        capacity: l.capacity!,
        used: l._count.vessels,
        pct: Math.round((l._count.vessels / l.capacity!) * 100),
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
