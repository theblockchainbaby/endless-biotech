import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  const [
    totalVessels,
    activeVessels,
    totalExplants,
    vesselsByStatus,
    vesselsByCultivar,
    recentActivities,
    healthBreakdown,
    readyToMultiply,
  ] = await Promise.all([
    prisma.vessel.count(),
    prisma.vessel.count({
      where: { status: { notIn: ["multiplied", "disposed"] } },
    }),
    prisma.vessel.aggregate({
      _sum: { explantCount: true },
      where: { status: { notIn: ["multiplied", "disposed"] } },
    }),
    prisma.vessel.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
    prisma.vessel.groupBy({
      by: ["cultivarId"],
      _count: { id: true },
      _sum: { explantCount: true },
      where: { status: { notIn: ["multiplied", "disposed"] }, cultivarId: { not: null } },
    }),
    prisma.activity.findMany({
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
      where: { status: { notIn: ["multiplied", "disposed"] } },
    }),
    // Vessels in growth chamber for 2+ weeks
    prisma.vessel.findMany({
      where: {
        status: "growing",
        updatedAt: { lte: twoWeeksAgo },
      },
      include: { cultivar: true },
      orderBy: { updatedAt: "asc" },
    }),
  ]);

  // Resolve cultivar names
  const cultivarIds = vesselsByCultivar
    .map((v) => v.cultivarId)
    .filter((id): id is string => id !== null);
  const cultivars = await prisma.cultivar.findMany({
    where: { id: { in: cultivarIds } },
  });
  const cultivarMap = Object.fromEntries(cultivars.map((c) => [c.id, c.name]));

  return NextResponse.json({
    totalVessels,
    activeVessels,
    totalExplants: totalExplants._sum.explantCount || 0,
    vesselsByStatus: vesselsByStatus.map((v) => ({
      status: v.status,
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
  });
}
