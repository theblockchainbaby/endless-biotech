import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError, parseBody } from "@/lib/api-helpers";
import { updateInventoryItemSchema, recordInventoryUsageSchema } from "@/lib/validations";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const item = await prisma.inventoryItem.findFirst({
      where: { id, organizationId: user.organizationId },
    });
    if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });

    const usage = await prisma.inventoryUsage.findMany({
      where: { itemId: id },
      include: { usedBy: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ ...item, usage });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await parseBody(req, updateInventoryItemSchema);

    const existing = await prisma.inventoryItem.findFirst({
      where: { id, organizationId: user.organizationId },
    });
    if (!existing) return NextResponse.json({ error: "Item not found" }, { status: 404 });

    const item = await prisma.inventoryItem.update({
      where: { id },
      data: {
        ...body,
        expirationDate: body.expirationDate ? new Date(body.expirationDate) : undefined,
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const existing = await prisma.inventoryItem.findFirst({
      where: { id, organizationId: user.organizationId },
    });
    if (!existing) return NextResponse.json({ error: "Item not found" }, { status: 404 });

    await prisma.inventoryItem.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
