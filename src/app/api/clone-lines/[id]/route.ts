import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/api-helpers";
import { z } from "zod";

const updateCloneLineSchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().nullable().optional(),
  status: z.enum(["active", "retired", "quarantined"]).optional(),
  notes: z.string().nullable().optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const cloneLine = await prisma.cloneLine.findFirst({
      where: { id, organizationId: user.organizationId },
      include: {
        cultivar: true,
        vessels: {
          where: { status: { not: "disposed" } },
          include: { location: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
          take: 100,
        },
      },
    });

    if (!cloneLine) {
      return NextResponse.json({ error: "Clone line not found" }, { status: 404 });
    }

    return NextResponse.json(cloneLine);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = updateCloneLineSchema.parse(await req.json());

    const cloneLine = await prisma.cloneLine.update({
      where: { id, organizationId: user.organizationId },
      data: body,
    });

    return NextResponse.json(cloneLine);
  } catch (error) {
    return handleApiError(error);
  }
}
