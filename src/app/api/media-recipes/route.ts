import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError, parseBody } from "@/lib/api-helpers";
import { createMediaRecipeSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    const stage = searchParams.get("stage");
    const baseMedia = searchParams.get("baseMedia");

    const where: Record<string, unknown> = {
      organizationId: user.organizationId,
      isActive: true,
    };
    if (stage) where.stage = stage;
    if (baseMedia) where.baseMedia = baseMedia;

    const recipes = await prisma.mediaRecipe.findMany({
      where,
      include: { components: true, _count: { select: { vessels: true, batches: true } } },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(recipes);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await parseBody(req, createMediaRecipeSchema);

    const recipe = await prisma.mediaRecipe.create({
      data: {
        name: body.name,
        baseMedia: body.baseMedia,
        targetPH: body.targetPH ?? null,
        agarConcentration: body.agarConcentration ?? null,
        sucroseConcentration: body.sucroseConcentration ?? null,
        stage: body.stage ?? null,
        notes: body.notes ?? null,
        organizationId: user.organizationId,
        components: body.components
          ? { create: body.components }
          : undefined,
      },
      include: { components: true },
    });

    return NextResponse.json(recipe, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
