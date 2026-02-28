import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError, parseBody } from "@/lib/api-helpers";
import { multiplyVesselSchema } from "@/lib/validations";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await parseBody(req, multiplyVesselSchema);

    const parent = await prisma.vessel.findFirst({
      where: { id, organizationId: user.organizationId },
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
          userId: user.id,
          type: "multiplied",
          category: "vessel",
          previousState: { status: parent.status },
          newState: { status: "multiplied" },
          metadata: { childCount: body.children.length },
          notes: `Multiplied into ${body.children.length} new vessels`,
        },
      });

      // Create child vessels
      const children = [];
      for (const child of body.children) {
        const newVessel = await tx.vessel.create({
          data: {
            barcode: child.barcode,
            cultivarId: parent.cultivarId,
            mediaRecipeId: child.mediaRecipeId || parent.mediaRecipeId,
            locationId: parent.locationId,
            explantCount: child.explantCount || 0,
            healthStatus: "healthy",
            status: "planted",
            stage: "multiplication",
            subcultureNumber: parent.subcultureNumber + 1,
            generation: parent.generation + 1,
            notes: child.notes || null,
            parentVesselId: id,
            organizationId: user.organizationId,
          },
          include: { cultivar: true },
        });

        await tx.activity.create({
          data: {
            vesselId: newVessel.id,
            userId: user.id,
            type: "created",
            category: "vessel",
            newState: { status: "planted", stage: "multiplication" },
            metadata: { parentBarcode: parent.barcode, parentId: id },
            notes: `Created from multiplication of ${parent.barcode}`,
          },
        });

        children.push(newVessel);
      }

      return children;
    });

    return NextResponse.json(
      { parent: { id, barcode: parent.barcode }, children: created },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
