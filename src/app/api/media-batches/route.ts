import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError, parseBody } from "@/lib/api-helpers";
import { createMediaBatchSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    const recipeId = searchParams.get("recipeId");

    const where: Record<string, unknown> = {
      recipe: { organizationId: user.organizationId },
    };
    if (recipeId) where.recipeId = recipeId;

    const batches = await prisma.mediaBatch.findMany({
      where,
      include: {
        recipe: { select: { id: true, name: true, baseMedia: true } },
        preparedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(batches);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await parseBody(req, createMediaBatchSchema);

    const batch = await prisma.mediaBatch.create({
      data: {
        batchNumber: body.batchNumber,
        recipeId: body.recipeId,
        volumeL: body.volumeL,
        vesselCount: body.vesselCount,
        measuredPH: body.measuredPH ?? null,
        autoclaved: body.autoclaved,
        autoclavedAt: body.autoclavedAt ? new Date(body.autoclavedAt) : null,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
        notes: body.notes ?? null,
        preparedById: user.id,
      },
      include: {
        recipe: { select: { id: true, name: true } },
        preparedBy: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(batch, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
