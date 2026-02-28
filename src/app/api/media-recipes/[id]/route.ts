import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError, parseBody } from "@/lib/api-helpers";
import { updateMediaRecipeSchema } from "@/lib/validations";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const recipe = await prisma.mediaRecipe.findFirst({
      where: { id, organizationId: user.organizationId },
      include: {
        components: true,
        batches: { orderBy: { createdAt: "desc" }, take: 20, include: { preparedBy: { select: { id: true, name: true } } } },
        _count: { select: { vessels: true } },
      },
    });

    if (!recipe) return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    return NextResponse.json(recipe);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await parseBody(req, updateMediaRecipeSchema);

    const existing = await prisma.mediaRecipe.findFirst({
      where: { id, organizationId: user.organizationId },
    });
    if (!existing) return NextResponse.json({ error: "Recipe not found" }, { status: 404 });

    // If components are provided, replace them all
    if (body.components) {
      await prisma.mediaComponent.deleteMany({ where: { recipeId: id } });
    }

    const recipe = await prisma.mediaRecipe.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.baseMedia !== undefined && { baseMedia: body.baseMedia }),
        ...(body.targetPH !== undefined && { targetPH: body.targetPH }),
        ...(body.agarConcentration !== undefined && { agarConcentration: body.agarConcentration }),
        ...(body.sucroseConcentration !== undefined && { sucroseConcentration: body.sucroseConcentration }),
        ...(body.stage !== undefined && { stage: body.stage }),
        ...(body.notes !== undefined && { notes: body.notes }),
        ...(body.components && { components: { create: body.components } }),
      },
      include: { components: true },
    });

    return NextResponse.json(recipe);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const existing = await prisma.mediaRecipe.findFirst({
      where: { id, organizationId: user.organizationId },
    });
    if (!existing) return NextResponse.json({ error: "Recipe not found" }, { status: 404 });

    await prisma.mediaRecipe.update({
      where: { id },
      data: { isActive: false },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
