import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireRole, handleApiError } from "@/lib/api-helpers";
import { z } from "zod";

const createRuleSchema = z.object({
  stage: z.string().min(1),
  containerType: z.string().default("jar"),
  taskType: z.string().default("transfer"),
  basePoints: z.number().positive(),
  cultivarId: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
});

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    const stage = searchParams.get("stage");

    const where: Record<string, unknown> = {
      organizationId: user.organizationId,
    };
    if (stage) where.stage = stage;

    const rules = await prisma.incentivePointRule.findMany({
      where,
      include: {
        cultivar: { select: { id: true, name: true, code: true } },
      },
      orderBy: [{ stage: "asc" }, { taskType: "asc" }, { containerType: "asc" }],
    });
    return NextResponse.json(rules);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    requireRole(user, "admin", "director", "manager");
    const body = createRuleSchema.parse(await req.json());

    const rule = await prisma.incentivePointRule.create({
      data: {
        ...body,
        cultivarId: body.cultivarId || null,
        organizationId: user.organizationId,
      },
      include: {
        cultivar: { select: { id: true, name: true, code: true } },
      },
    });
    return NextResponse.json(rule, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
