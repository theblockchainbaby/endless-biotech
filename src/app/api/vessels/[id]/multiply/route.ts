import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { newVessels, userId } = body;
  // newVessels: Array<{ barcode: string, explantCount: number, mediaType?: string, notes?: string }>

  const parent = await prisma.vessel.findUnique({
    where: { id },
    include: { cultivar: true },
  });

  if (!parent) return NextResponse.json({ error: "Parent vessel not found" }, { status: 404 });

  const created = await prisma.$transaction(async (tx) => {
    // Mark parent as multiplied
    await tx.vessel.update({
      where: { id },
      data: { status: "multiplied" },
    });

    await tx.activity.create({
      data: {
        vesselId: id,
        userId: userId || null,
        type: "multiplied",
        notes: `Multiplied into ${newVessels.length} new vessels`,
      },
    });

    // Create child vessels
    const children = [];
    for (const nv of newVessels) {
      const child = await tx.vessel.create({
        data: {
          barcode: nv.barcode,
          cultivarId: parent.cultivarId,
          mediaType: nv.mediaType || parent.mediaType,
          explantCount: nv.explantCount || 0,
          healthStatus: "healthy",
          status: "planted",
          notes: nv.notes || null,
          parentVesselId: id,
        },
        include: { cultivar: true },
      });

      await tx.activity.create({
        data: {
          vesselId: child.id,
          userId: userId || null,
          type: "planted",
          notes: `Created from multiplication of vessel ${parent.barcode}`,
        },
      });

      children.push(child);
    }

    return children;
  });

  return NextResponse.json({ parent: { id, barcode: parent.barcode }, children: created }, { status: 201 });
}
