import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requireApiKey, hasPermission, handleApiKeyError } from "@/lib/api-key-auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const apiUser = await requireApiKey(req);
    if (!hasPermission(apiUser, "vessels:read")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { id } = await params;

    const vessel = await prisma.vessel.findFirst({
      where: { id, organizationId: apiUser.organizationId },
      include: {
        cultivar: true,
        location: true,
        cloneLine: true,
        mediaRecipe: { select: { id: true, name: true } },
        parentVessel: { select: { id: true, barcode: true } },
        childVessels: { select: { id: true, barcode: true, stage: true, status: true } },
      },
    });

    if (!vessel) {
      return NextResponse.json({ error: "Vessel not found" }, { status: 404 });
    }

    return NextResponse.json({ data: vessel });
  } catch (error) {
    return handleApiKeyError(error);
  }
}
