import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAuth, requireRole, handleApiError } from "@/lib/api-helpers";
import { z } from "zod";

const updateRuleSchema = z.object({
  stage: z.string().min(1).optional(),
  containerType: z.string().optional(),
  taskType: z.string().optional(),
  basePoints: z.number().positive().optional(),
  cultivarId: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    requireRole(user, "admin", "director", "manager");
    const { id } = await params;
    const body = updateRuleSchema.parse(await req.json());

    const rule = await prisma.incentivePointRule.update({
      where: { id, organizationId: user.organizationId },
      data: body,
      include: {
        cultivar: { select: { id: true, name: true, code: true } },
      },
    });
    return NextResponse.json(rule);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    requireRole(user, "admin", "director", "manager");
    const { id } = await params;

    await prisma.incentivePointRule.delete({
      where: { id, organizationId: user.organizationId },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
