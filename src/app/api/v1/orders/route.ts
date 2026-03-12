import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requireApiKey, hasPermission, handleApiKeyError } from "@/lib/api-key-auth";

export async function GET(req: NextRequest) {
  try {
    const apiUser = await requireApiKey(req);
    if (!hasPermission(apiUser, "orders:read")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const limit = Math.min(parseInt(searchParams.get("limit") || "100"), 500);
    const offset = parseInt(searchParams.get("offset") || "0");

    const where: Record<string, unknown> = {
      organizationId: apiUser.organizationId,
    };
    if (status) where.status = status;

    const [orders, total] = await Promise.all([
      prisma.salesOrder.findMany({
        where,
        include: {
          cultivar: { select: { id: true, name: true, code: true } },
        },
        take: limit,
        skip: offset,
        orderBy: { dueDate: "asc" },
      }),
      prisma.salesOrder.count({ where }),
    ]);

    return NextResponse.json({
      data: orders,
      pagination: { total, limit, offset, hasMore: offset + limit < total },
    });
  } catch (error) {
    return handleApiKeyError(error);
  }
}
