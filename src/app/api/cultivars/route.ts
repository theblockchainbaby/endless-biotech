import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError, parseBody } from "@/lib/api-helpers";
import { createCultivarSchema } from "@/lib/validations";

export async function GET() {
  try {
    const user = await requireAuth();

    const cultivars = await prisma.cultivar.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { name: "asc" },
      include: {
        _count: { select: { vessels: true } },
        defaultMediaRecipe: { select: { id: true, name: true } },
      },
    });

    // Aggregate health data per cultivar
    const healthAgg = await prisma.vessel.groupBy({
      by: ["cultivarId", "healthStatus"],
      _count: { id: true },
      where: {
        organizationId: user.organizationId,
        status: { notIn: ["multiplied", "disposed"] },
        cultivarId: { not: null },
      },
    });

    const healthMap: Record<string, { total: number; healthy: number; contaminated: number }> = {};
    for (const row of healthAgg) {
      if (!row.cultivarId) continue;
      if (!healthMap[row.cultivarId]) {
        healthMap[row.cultivarId] = { total: 0, healthy: 0, contaminated: 0 };
      }
      healthMap[row.cultivarId].total += row._count.id;
      if (row.healthStatus === "healthy") healthMap[row.cultivarId].healthy += row._count.id;
      if (row.healthStatus === "critical" || row.healthStatus === "dead") healthMap[row.cultivarId].contaminated += row._count.id;
    }

    const cultivarsWithHealth = cultivars.map((c) => {
      const h = healthMap[c.id];
      let cultivarHealth = "healthy";
      if (h && h.total > 0) {
        const healthyRate = h.healthy / h.total;
        const contaminationRate = h.contaminated / h.total;
        if (healthyRate > 0.8 && contaminationRate < 0.05) cultivarHealth = "healthy";
        else if (healthyRate > 0.5 && contaminationRate < 0.15) cultivarHealth = "stable";
        else cultivarHealth = "critical";
      }
      return { ...c, cultivarHealth };
    });

    return NextResponse.json(cultivarsWithHealth);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await parseBody(req, createCultivarSchema);

    const cultivar = await prisma.cultivar.create({
      data: {
        name: body.name,
        code: body.code || null,
        cultivarType: body.cultivarType || "in_house",
        species: body.species,
        strain: body.strain || null,
        geneticLineage: body.geneticLineage || null,
        description: body.description || null,
        targetMultiplicationRate: body.targetMultiplicationRate || null,
        defaultMediaRecipeId: body.defaultMediaRecipeId || null,
        organizationId: user.organizationId,
      },
    });

    return NextResponse.json(cultivar, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
