import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError, parseBody } from "@/lib/api-helpers";
import { updateCultivarSchema } from "@/lib/validations";

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
