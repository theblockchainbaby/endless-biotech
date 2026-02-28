import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError, parseBody } from "@/lib/api-helpers";
import { recordInventoryUsageSchema } from "@/lib/validations";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await parseBody(req, recordInventoryUsageSchema);

    const item = await prisma.inventoryItem.findFirst({
      where: { id, organizationId: user.organizationId },
    });
    if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });

    const newStock = item.currentStock + body.quantity;
    if (newStock < 0) {
      return NextResponse.json({ error: "Insufficient stock" }, { status: 400 });
    }

    // Create usage record and update stock in transaction
    const [usage, updated] = await prisma.$transaction([
      prisma.inventoryUsage.create({
        data: {
          itemId: id,
          quantity: body.quantity,
          reason: body.reason ?? null,
          usedById: user.id,
        },
      }),
      prisma.inventoryItem.update({
        where: { id },
        data: { currentStock: newStock },
      }),
    ]);

    // Check if stock is now below reorder level
    if (updated.reorderLevel != null && updated.currentStock <= updated.reorderLevel) {
      await prisma.alert.create({
        data: {
          type: "low_inventory",
          severity: updated.currentStock === 0 ? "critical" : "warning",
          title: `Low stock: ${updated.name}`,
          message: `${updated.currentStock} ${updated.unit} remaining (reorder at ${updated.reorderLevel})`,
          entityType: "inventory",
          entityId: id,
          organizationId: user.organizationId,
        },
      });
    }

    return NextResponse.json({ usage, currentStock: updated.currentStock });
  } catch (error) {
    return handleApiError(error);
  }
}
