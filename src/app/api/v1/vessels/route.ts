import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requireApiKey, hasPermission, handleApiKeyError } from "@/lib/api-key-auth";

export async function GET(req: NextRequest) {
  try {
    const apiUser = await requireApiKey(req);
    if (!hasPermission(apiUser, "vessels:read")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const stage = searchParams.get("stage");
    const status = searchParams.get("status");
    const cultivarId = searchParams.get("cultivar_id");
    const cloneLineId = searchParams.get("clone_line_id");
    const limit = Math.min(parseInt(searchParams.get("limit") || "100"), 500);
    const offset = parseInt(searchParams.get("offset") || "0");

    const where: Record<string, unknown> = {
      organizationId: apiUser.organizationId,
    };
    if (stage) where.stage = stage;
    if (status) where.status = status;
    if (cultivarId) where.cultivarId = cultivarId;
    if (cloneLineId) where.cloneLineId = cloneLineId;

    const [vessels, total] = await Promise.all([
      prisma.vessel.findMany({
        where,
        include: {
          cultivar: { select: { id: true, name: true, code: true } },
          location: { select: { id: true, name: true } },
          cloneLine: { select: { id: true, name: true, code: true } },
        },
        take: limit,
        skip: offset,
        orderBy: { updatedAt: "desc" },
      }),
      prisma.vessel.count({ where }),
    ]);

    return NextResponse.json({
      data: vessels,
      pagination: { total, limit, offset, hasMore: offset + limit < total },
    });
  } catch (error) {
    return handleApiKeyError(error);
  }
}
