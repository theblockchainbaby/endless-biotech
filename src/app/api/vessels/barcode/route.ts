import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  if (!code) return NextResponse.json({ error: "Barcode required" }, { status: 400 });

  const vessel = await prisma.vessel.findUnique({
    where: { barcode: code },
    include: {
      cultivar: true,
      parentVessel: { select: { id: true, barcode: true } },
      childVessels: { select: { id: true, barcode: true, status: true } },
      activities: { include: { user: true }, orderBy: { createdAt: "desc" }, take: 10 },
    },
  });

  return NextResponse.json({ found: !!vessel, vessel });
}
