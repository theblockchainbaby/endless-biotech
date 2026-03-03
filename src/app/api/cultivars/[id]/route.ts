import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError, parseBody } from "@/lib/api-helpers";
import { updateCultivarSchema } from "@/lib/validations";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const cultivar = await prisma.cultivar.findFirst({
      where: { id, organizationId: user.organizationId },
      include: {
        defaultMediaRecipe: { select: { id: true, name: true } },
        _count: { select: { vessels: true } },
      },
    });

    if (!cultivar) return NextResponse.json({ error: "Cultivar not found" }, { status: 404 });

    const activeFilter = { cultivarId: id, status: { notIn: ["multiplied", "disposed"] } };

    const [
      totalVessels,
      activeVessels,
      totalExplants,
      vesselsByStage,
      vesselsByHealthStatus,
      vesselsByStatus,
      contaminatedCount,
    ] = await Promise.all([
      prisma.vessel.count({ where: { cultivarId: id } }),
      prisma.vessel.count({ where: activeFilter }),
      prisma.vessel.aggregate({ _sum: { explantCount: true }, where: activeFilter }),
      prisma.vessel.groupBy({ by: ["stage"], _count: { id: true }, where: activeFilter }),
      prisma.vessel.groupBy({ by: ["healthStatus"], _count: { id: true }, where: activeFilter }),
      prisma.vessel.groupBy({ by: ["status"], _count: { id: true }, where: { cultivarId: id } }),
      prisma.vessel.count({ where: { ...activeFilter, contaminationType: { not: null } } }),
    ]);

    const healthyCount = vesselsByHealthStatus.find((h) => h.healthStatus === "healthy")?._count.id ?? 0;
    const contaminationRate = activeVessels > 0 ? contaminatedCount / activeVessels : 0;
    const healthyRate = activeVessels > 0 ? healthyCount / activeVessels : 1;

    let cultivarHealth: "healthy" | "stable" | "critical";
    if (healthyRate > 0.8 && contaminationRate < 0.05) {
      cultivarHealth = "healthy";
    } else if (healthyRate > 0.5 && contaminationRate < 0.15) {
      cultivarHealth = "stable";
    } else {
      cultivarHealth = "critical";
    }

    const disposedCount = vesselsByStatus.find((v) => v.status === "disposed")?._count.id ?? 0;

    return NextResponse.json({
      ...cultivar,
      metrics: {
        totalVessels,
        activeVessels,
        disposedVessels: disposedCount,
        totalExplants: totalExplants._sum.explantCount ?? 0,
        contaminationRate: Math.round(contaminationRate * 100),
        healthyRate: Math.round(healthyRate * 100),
        cultivarHealth,
        vesselsByStage: vesselsByStage.map((v) => ({ stage: v.stage, count: v._count.id })),
        vesselsByHealthStatus: vesselsByHealthStatus.map((v) => ({ status: v.healthStatus, count: v._count.id })),
        vesselsByStatus: vesselsByStatus.map((v) => ({ status: v.status, count: v._count.id })),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await parseBody(req, updateCultivarSchema);

    const existing = await prisma.cultivar.findFirst({
      where: { id, organizationId: user.organizationId },
    });
    if (!existing) return NextResponse.json({ error: "Cultivar not found" }, { status: 404 });

    const cultivar = await prisma.cultivar.update({
      where: { id },
      data: body,
    });

    return NextResponse.json(cultivar);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const existing = await prisma.cultivar.findFirst({
      where: { id, organizationId: user.organizationId },
      include: { _count: { select: { vessels: true } } },
    });
    if (!existing) return NextResponse.json({ error: "Cultivar not found" }, { status: 404 });
    if (existing._count.vessels > 0) {
      return NextResponse.json(
        { error: "Cannot delete cultivar with existing vessels" },
        { status: 400 }
      );
    }

    await prisma.cultivar.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
