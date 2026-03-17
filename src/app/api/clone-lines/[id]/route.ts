import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/api-helpers";
import { z } from "zod";

const updateCloneLineSchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().nullable().optional(),
  lineNumber: z.number().int().positive().nullable().optional(),
  status: z.enum(["active", "retired", "quarantined"]).optional(),
  sourceType: z.enum(["mother_plant", "meristem", "seed"]).optional(),
  notes: z.string().nullable().optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const cloneLine = await prisma.cloneLine.findFirst({
      where: { id, organizationId: user.organizationId },
      include: {
        cultivar: { select: { id: true, name: true, code: true, species: true } },
        pathogenTests: {
          orderBy: { testDate: "desc" },
          include: { loggedBy: { select: { id: true, name: true } } },
        },
        _count: { select: { vessels: true } },
      },
    });

    if (!cloneLine) {
      return NextResponse.json({ error: "Clone line not found" }, { status: 404 });
    }

    const stageCounts = await prisma.vessel.groupBy({
      by: ["stage"],
      where: { cloneLineId: id, organizationId: user.organizationId, status: { not: "disposed" } },
      _count: true,
    });

    return NextResponse.json({
      ...cloneLine,
      vesselCount: cloneLine._count.vessels,
      byStage: stageCounts.reduce((acc, s) => ({ ...acc, [s.stage]: s._count }), {} as Record<string, number>),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = updateCloneLineSchema.parse(await req.json());

    const cloneLine = await prisma.cloneLine.update({
      where: { id, organizationId: user.organizationId },
      data: body,
    });

    return NextResponse.json(cloneLine);
  } catch (error) {
    return handleApiError(error);
  }
}
