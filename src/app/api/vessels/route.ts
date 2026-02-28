import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const cultivarId = searchParams.get("cultivarId");
  const status = searchParams.get("status");
  const healthStatus = searchParams.get("healthStatus");
  const search = searchParams.get("search");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");

  const where: Record<string, unknown> = {};
  if (cultivarId) where.cultivarId = cultivarId;
  if (status) where.status = status;
  if (healthStatus) where.healthStatus = healthStatus;
  if (search) where.barcode = { contains: search };

  const [vessels, total] = await Promise.all([
    prisma.vessel.findMany({
      where,
      include: { cultivar: true, parentVessel: { select: { id: true, barcode: true } } },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.vessel.count({ where }),
  ]);

  return NextResponse.json({ vessels, total, page, limit });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { barcode, cultivarId, mediaType, explantCount, healthStatus, status, notes, parentVesselId, userId } = body;

  const vessel = await prisma.vessel.create({
    data: {
      barcode,
      cultivarId: cultivarId || null,
      mediaType: mediaType || null,
      explantCount: explantCount || 0,
      healthStatus: healthStatus || "healthy",
      status: status || "media_filled",
      notes: notes || null,
      parentVesselId: parentVesselId || null,
    },
    include: { cultivar: true },
  });

  await prisma.activity.create({
    data: {
      vesselId: vessel.id,
      userId: userId || null,
      type: status || "media_filled",
      notes: notes || `Vessel ${barcode} created`,
    },
  });

  return NextResponse.json(vessel, { status: 201 });
}
