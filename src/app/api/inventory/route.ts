import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError, parseBody } from "@/lib/api-helpers";
import { createInventoryItemSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const lowStock = searchParams.get("lowStock");

    const where: Record<string, unknown> = {
      organizationId: user.organizationId,
    };
    if (category) where.category = category;

    const items = await prisma.inventoryItem.findMany({
      where,
      orderBy: { name: "asc" },
    });

    // Filter low stock client-side since it requires comparing two columns
    let result = items;
    if (lowStock === "true") {
      result = items.filter((item) =>
        item.reorderLevel != null && item.currentStock <= item.reorderLevel
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await parseBody(req, createInventoryItemSchema);

    const item = await prisma.inventoryItem.create({
      data: {
        ...body,
        expirationDate: body.expirationDate ? new Date(body.expirationDate) : null,
        organizationId: user.organizationId,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
