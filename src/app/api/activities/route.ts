import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const vesselId = searchParams.get("vesselId");
  const type = searchParams.get("type");
  const limit = parseInt(searchParams.get("limit") || "100");

  const where: Record<string, unknown> = {};
  if (vesselId) where.vesselId = vesselId;
  if (type) where.type = type;

  const activities = await prisma.activity.findMany({
    where,
    include: {
      vessel: { select: { id: true, barcode: true } },
      user: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return NextResponse.json(activities);
}
