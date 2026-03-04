import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/api-helpers";

export async function GET() {
  try {
    const user = await requireAuth();
    const orgId = user.organizationId;
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const now = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    const activeFilter = {
      organizationId: orgId,
      status: { notIn: ["media_filled", "multiplied", "disposed"] },
    };

    const [
      totalVessels,
      activeVessels,
      mediaPrepVessels,
      totalExplants,
      vesselsByStatus,
      vesselsByStage,
      vesselsByCultivar,
      recentActivities,
      healthBreakdown,
      readyToMultiply,
      subcultureOverdue,
      subcultureToday,
      subcultureThisWeek,
    ] = await Promise.all([
      prisma.vessel.count({ where: { organizationId: orgId } }),
      prisma.vessel.count({ where: activeFilter }),
      prisma.vessel.count({ where: { organizationId: orgId, status: "media_filled" } }),
      prisma.vessel.aggregate({
        _sum: { explantCount: true },
        where: activeFilter,
      }),
      prisma.vessel.groupBy({
        by: ["status"],
        _count: { id: true },
        where: { organizationId: orgId },
      }),
      prisma.vessel.groupBy({
        by: ["stage"],
        _count: { id: true },
        where: activeFilter,
      }),
      prisma.vessel.groupBy({
        by: ["cultivarId"],
        _count: { id: true },
        _sum: { explantCount: true },
        where: { ...activeFilter, cultivarId: { not: null } },
      }),
      prisma.activity.findMany({
        where: { vessel: { organizationId: orgId } },
        include: {
          vessel: { select: { id: true, barcode: true } },
          user: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.vessel.groupBy({
        by: ["healthStatus"],
        _count: { id: true },
        where: activeFilter,
      }),
      prisma.vessel.findMany({
        where: {
          organizationId: orgId,
          status: "growing",
          updatedAt: { lte: twoWeeksAgo },
        },
        include: { cultivar: true },
        orderBy: { updatedAt: "asc" },
      }),
      // Subculture reminders
      prisma.vessel.count({
        where: {
          ...activeFilter,
          nextSubcultureDate: { lt: now },
        },
      }),
      prisma.vessel.count({
        where: {
          ...activeFilter,
          nextSubcultureDate: {
            gte: new Date(now.toDateString()),
            lt: new Date(new Date(now.toDateString()).getTime() + 86400000),
          },
        },
      }),
      prisma.vessel.count({
        where: {
          ...activeFilter,
          nextSubcultureDate: {
            gte: now,
            lte: threeDaysFromNow,
          },
        },
      }),
    ]);

    // Resolve cultivar names
    const cultivarIds = vesselsByCultivar
      .map((v) => v.cultivarId)
      .filter((id): id is string => id !== null);
    const cultivars = cultivarIds.length > 0
      ? await prisma.cultivar.findMany({ where: { id: { in: cultivarIds } } })
      : [];
    const cultivarMap = Object.fromEntries(cultivars.map((c) => [c.id, c.name]));

    return NextResponse.json({
      totalVessels,
      activeVessels,
      mediaPrepVessels,
      totalExplants: totalExplants._sum.explantCount || 0,
      vesselsByStatus: vesselsByStatus.map((v) => ({
        status: v.status,
        count: v._count.id,
      })),
      vesselsByStage: vesselsByStage.map((v) => ({
        stage: v.stage,
        count: v._count.id,
      })),
      vesselsByCultivar: vesselsByCultivar.map((v) => ({
        cultivarId: v.cultivarId,
        cultivarName: v.cultivarId ? cultivarMap[v.cultivarId] || "Unknown" : "Unassigned",
        vesselCount: v._count.id,
        explantCount: v._sum.explantCount || 0,
      })),
      recentActivities,
      healthBreakdown: healthBreakdown.map((h) => ({
        status: h.healthStatus,
        count: h._count.id,
      })),
      readyToMultiply: readyToMultiply.map((v) => ({
        id: v.id,
        barcode: v.barcode,
        cultivarName: v.cultivar?.name || "Unknown",
        explantCount: v.explantCount,
        updatedAt: v.updatedAt,
      })),
      subcultureDue: {
        overdue: subcultureOverdue,
        today: subcultureToday,
        thisWeek: subcultureThisWeek,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
