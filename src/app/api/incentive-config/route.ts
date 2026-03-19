import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAuth, requireRole, handleApiError } from "@/lib/api-helpers";
import { z } from "zod";

const configSchema = z.object({
  baseHourlyRate: z.number().positive().optional(),
  pointDollarValue: z.number().positive().optional(),
  contaminationThreshold: z.number().min(0).max(100).optional(),
  contaminationLookbackDays: z.number().int().positive().optional(),
  bonusPeriod: z.enum(["daily", "weekly", "biweekly", "monthly"]).optional(),
  dailyVesselTarget: z.number().int().positive().nullable().optional(),
  enableIncentives: z.boolean().optional(),
});

export async function GET() {
  try {
    const user = await requireAuth();
    const config = await prisma.incentiveConfig.findUnique({
      where: { organizationId: user.organizationId },
    });
    return NextResponse.json(config);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: Request) {
  try {
    const user = await requireAuth();
    requireRole(user, "admin", "director", "manager");
    const body = configSchema.parse(await req.json());

    const config = await prisma.incentiveConfig.upsert({
      where: { organizationId: user.organizationId },
      create: { organizationId: user.organizationId, ...body },
      update: body,
    });
    return NextResponse.json(config);
  } catch (error) {
    return handleApiError(error);
  }
}
