import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/api-helpers";
import { z } from "zod";

const createSalesOrderSchema = z.object({
  orderNumber: z.string().min(1, "Order number is required"),
  customerName: z.string().min(1, "Customer name is required"),
  cultivarId: z.string().min(1, "Cultivar is required"),
  quantity: z.number().int().positive("Quantity must be positive"),
  unitType: z.enum(["plugs", "liners", "rooted_cuttings", "tissue_culture_jars"]).default("plugs"),
  dueDate: z.string().min(1, "Due date is required"),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  notes: z.string().nullable().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const cultivarId = searchParams.get("cultivarId");

    const where: Record<string, unknown> = {
      organizationId: user.organizationId,
    };
    if (status && status !== "all") where.status = status;
    if (cultivarId) where.cultivarId = cultivarId;

    const orders = await prisma.salesOrder.findMany({
      where,
      include: {
        cultivar: { select: { id: true, name: true, code: true } },
      },
      orderBy: { dueDate: "asc" },
    });

    return NextResponse.json(orders);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = createSalesOrderSchema.parse(await req.json());

    const order = await prisma.salesOrder.create({
      data: {
        ...body,
        dueDate: new Date(body.dueDate),
        organizationId: user.organizationId,
      },
      include: {
        cultivar: { select: { id: true, name: true, code: true } },
      },
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
