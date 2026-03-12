import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/api-helpers";
import { z } from "zod";

const updateSalesOrderSchema = z.object({
  customerName: z.string().min(1).optional(),
  quantity: z.number().int().positive().optional(),
  dueDate: z.string().optional(),
  status: z.enum(["pending", "in_production", "partially_fulfilled", "fulfilled", "cancelled"]).optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
  notes: z.string().nullable().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = updateSalesOrderSchema.parse(await req.json());

    const data: Record<string, unknown> = { ...body };
    if (body.dueDate) data.dueDate = new Date(body.dueDate);

    const order = await prisma.salesOrder.update({
      where: { id, organizationId: user.organizationId },
      data,
      include: { cultivar: { select: { id: true, name: true, code: true } } },
    });

    return NextResponse.json(order);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    await prisma.salesOrder.delete({
      where: { id, organizationId: user.organizationId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
