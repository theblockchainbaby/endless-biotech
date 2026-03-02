import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError, parseBody } from "@/lib/api-helpers";
import { moveVesselSchema } from "@/lib/validations";
import { logActivity } from "@/lib/activity-logger";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await parseBody(req, moveVesselSchema);

    const vessel = await prisma.vessel.findFirst({
      where: { id, organizationId: user.organizationId },
      include: { location: { select: { id: true, name: true } } },
    });
    if (!vessel) return NextResponse.json({ error: "Vessel not found. It may have been deleted or belongs to another organization." }, { status: 404 });

    if (vessel.status === "disposed") {
      return NextResponse.json({ error: "Cannot move a disposed vessel." }, { status: 400 });
    }

    // Verify location belongs to user's org
    const location = await prisma.location.findFirst({
      where: { id: body.locationId, site: { organizationId: user.organizationId } },
    });
    if (!location) return NextResponse.json({ error: "Destination location not found. It may have been deactivated." }, { status: 404 });

    const previousLocation = vessel.location;

    const updated = await prisma.vessel.update({
      where: { id },
      data: { locationId: body.locationId },
      include: { cultivar: true, location: true },
    });

    await logActivity({
      vesselId: id,
      userId: user.id,
      type: "location_changed",
      category: "vessel",
      previousState: { locationId: previousLocation?.id ?? null, locationName: previousLocation?.name ?? null },
      newState: { locationId: location.id, locationName: location.name },
      notes: body.notes || `Moved to ${location.name}`,
    });

    return NextResponse.json(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
