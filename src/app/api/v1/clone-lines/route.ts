import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requireApiKey, hasPermission, handleApiKeyError } from "@/lib/api-key-auth";

export async function GET(req: NextRequest) {
  try {
    const apiUser = await requireApiKey(req);
    if (!hasPermission(apiUser, "clone_lines:read")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const cultivarId = searchParams.get("cultivar_id");
    const status = searchParams.get("status") || "active";

    const where: Record<string, unknown> = {
      organizationId: apiUser.organizationId,
    };
    if (cultivarId) where.cultivarId = cultivarId;
    if (status !== "all") where.status = status;

    const cloneLines = await prisma.cloneLine.findMany({
      where,
      include: {
        cultivar: { select: { id: true, name: true, code: true } },
        _count: { select: { vessels: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      data: cloneLines.map((cl) => ({
        ...cl,
        vesselCount: cl._count.vessels,
        _count: undefined,
      })),
    });
  } catch (error) {
    return handleApiKeyError(error);
  }
}
