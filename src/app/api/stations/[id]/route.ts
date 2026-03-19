import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAuth, requireRole, handleApiError } from "@/lib/api-helpers";
import { z } from "zod";

const updateStationSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.enum(["laminar_flow_hood", "clean_bench", "prep_station"]).optional(),
  locationId: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    requireRole(user, "admin", "director", "manager");
    const { id } = await params;
    const body = updateStationSchema.parse(await req.json());

    const station = await prisma.station.update({
      where: { id, organizationId: user.organizationId },
      data: body,
    });
    return NextResponse.json(station);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    requireRole(user, "admin", "director", "manager");
    const { id } = await params;

    await prisma.station.update({
      where: { id, organizationId: user.organizationId },
      data: { isActive: false },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
