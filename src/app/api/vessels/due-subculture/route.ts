import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "all"; // overdue, today, week, all

    const now = new Date();
    const todayStart = new Date(now.toDateString());
    const todayEnd = new Date(todayStart.getTime() + 86400000);
    const weekEnd = new Date(now.getTime() + 7 * 86400000);

    const activeFilter = {
      organizationId: user.organizationId,
      status: { notIn: ["multiplied", "disposed"] },
      nextSubcultureDate: { not: null },
    };

    let dateFilter: Record<string, unknown> = {};
    switch (range) {
      case "overdue":
        dateFilter = { lt: todayStart };
        break;
      case "today":
        dateFilter = { gte: todayStart, lt: todayEnd };
        break;
      case "week":
        dateFilter = { gte: now, lte: weekEnd };
        break;
      default:
        dateFilter = { lte: weekEnd };
        break;
    }

    const vessels = await prisma.vessel.findMany({
      where: {
        ...activeFilter,
        nextSubcultureDate: dateFilter as { lt?: Date; gte?: Date; lte?: Date },
      },
      include: {
        cultivar: { select: { name: true } },
        location: { select: { name: true } },
      },
      orderBy: { nextSubcultureDate: "asc" },
    });

    return NextResponse.json(vessels);
  } catch (error) {
    return handleApiError(error);
  }
}
