import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/api-helpers";
import { z } from "zod";

const createCloneLineSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().nullable().optional(),
  lineNumber: z.number().int().positive().nullable().optional(),
  cultivarId: z.string().min(1, "Cultivar is required"),
  sourceType: z.enum(["mother_plant", "meristem", "seed"]).default("mother_plant"),
  motherPlantId: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    const cultivarId = searchParams.get("cultivarId");
    const status = searchParams.get("status") || "active";

    const where: Record<string, unknown> = {
      organizationId: user.organizationId,
    };
    if (cultivarId) where.cultivarId = cultivarId;
    if (status !== "all") where.status = status;

    const cloneLines = await prisma.cloneLine.findMany({
      where,
      include: {
        cultivar: { select: { id: true, name: true, code: true } },
        _count: { select: { vessels: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Get stage breakdown for each clone line
    const enriched = await Promise.all(
      cloneLines.map(async (cl) => {
        const stageCounts = await prisma.vessel.groupBy({
          by: ["stage"],
          where: { cloneLineId: cl.id, organizationId: user.organizationId, status: { not: "disposed" } },
          _count: true,
        });
        const healthCounts = await prisma.vessel.groupBy({
          by: ["healthStatus"],
          where: { cloneLineId: cl.id, organizationId: user.organizationId, status: { not: "disposed" } },
          _count: true,
        });
        return {
          ...cl,
          vesselCount: cl._count.vessels,
          byStage: stageCounts.reduce((acc, s) => ({ ...acc, [s.stage]: s._count }), {}),
          byHealth: healthCounts.reduce((acc, h) => ({ ...acc, [h.healthStatus]: h._count }), {}),
        };
      })
    );

    return NextResponse.json(enriched);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = createCloneLineSchema.parse(await req.json());

    const cloneLine = await prisma.cloneLine.create({
      data: {
        ...body,
        organizationId: user.organizationId,
      },
      include: {
        cultivar: { select: { id: true, name: true, code: true } },
      },
    });

    return NextResponse.json(cloneLine, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
