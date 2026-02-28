import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const vessel = await prisma.vessel.findUnique({
    where: { id },
    include: {
      cultivar: true,
      parentVessel: { select: { id: true, barcode: true } },
      childVessels: { include: { cultivar: true }, orderBy: { createdAt: "desc" } },
      activities: { include: { user: true }, orderBy: { createdAt: "desc" } },
    },
  });

  if (!vessel) return NextResponse.json({ error: "Vessel not found" }, { status: 404 });
  return NextResponse.json(vessel);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { cultivarId, mediaType, explantCount, healthStatus, status, notes, userId } = body;

  const data: Record<string, unknown> = {};
  if (cultivarId !== undefined) data.cultivarId = cultivarId;
  if (mediaType !== undefined) data.mediaType = mediaType;
  if (explantCount !== undefined) data.explantCount = explantCount;
  if (healthStatus !== undefined) data.healthStatus = healthStatus;
  if (status !== undefined) data.status = status;
  if (notes !== undefined) data.notes = notes;

  const vessel = await prisma.vessel.update({
    where: { id },
    data,
    include: { cultivar: true },
  });

  if (status || healthStatus) {
    await prisma.activity.create({
      data: {
        vesselId: id,
        userId: userId || null,
        type: status ? status : "health_update",
        notes: notes || `Status updated to ${status || healthStatus}`,
      },
    });
  }

  return NextResponse.json(vessel);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.vessel.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
