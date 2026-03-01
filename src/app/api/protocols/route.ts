import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/api-helpers";
import { z } from "zod";

const stepSchema = z.object({
  order: z.number().int().min(1),
  instruction: z.string().min(1),
  duration: z.string().optional(),
  critical: z.boolean().optional(),
});

const createProtocolSchema = z.object({
  name: z.string().min(1),
  stage: z.string().min(1),
  steps: z.array(stepSchema).min(1),
  safetyNotes: z.string().nullable().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    const stage = searchParams.get("stage");

    const where: Record<string, unknown> = {
      organizationId: user.organizationId,
      isActive: true,
    };
    if (stage) where.stage = stage;

    const protocols = await prisma.protocol.findMany({
      where,
      orderBy: [{ stage: "asc" }, { name: "asc" }],
    });
    return NextResponse.json(protocols);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = createProtocolSchema.parse(await req.json());

    const protocol = await prisma.protocol.create({
      data: {
        name: body.name,
        stage: body.stage,
        steps: body.steps as unknown as import("@prisma/client").Prisma.InputJsonValue,
        safetyNotes: body.safetyNotes || null,
        organizationId: user.organizationId,
      },
    });

    return NextResponse.json(protocol, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
