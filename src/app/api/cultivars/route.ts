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
    return NextResponse.json(cultivars);
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
