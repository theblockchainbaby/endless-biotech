import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/api-helpers";
import { z } from "zod";

const clockInSchema = z.object({
  stationId: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const status = searchParams.get("status");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const where: Record<string, unknown> = {
      organizationId: user.organizationId,
    };

    // Techs can only see their own shifts unless they're admin/director/manager
    if (["tech", "supervisor"].includes(user.role) && !userId) {
      where.userId = user.id;
    } else if (userId) {
      where.userId = userId;
    }

    if (status) where.status = status;
    if (from || to) {
      where.clockIn = {};
      if (from) (where.clockIn as Record<string, unknown>).gte = new Date(from);
      if (to) (where.clockIn as Record<string, unknown>).lte = new Date(to);
    }

    const shifts = await prisma.techShift.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        station: { select: { id: true, name: true, type: true } },
      },
      orderBy: { clockIn: "desc" },
      take: 100,
    });
    return NextResponse.json(shifts);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const body = clockInSchema.parse(await req.json());

    // Check for existing active shift
    const active = await prisma.techShift.findFirst({
      where: {
        userId: user.id,
        organizationId: user.organizationId,
        status: "active",
      },
    });
    if (active) {
      return NextResponse.json(
        { error: "You already have an active shift. Clock out first." },
        { status: 400 }
      );
    }

    const shift = await prisma.techShift.create({
      data: {
        userId: user.id,
        organizationId: user.organizationId,
        stationId: body.stationId || null,
        clockIn: new Date(),
        notes: body.notes || null,
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        station: { select: { id: true, name: true, type: true } },
      },
    });
    return NextResponse.json(shift, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
