import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAuth, requireRole, handleApiError } from "@/lib/api-helpers";
import { z } from "zod";

const createStationSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["laminar_flow_hood", "clean_bench", "prep_station"]).default("laminar_flow_hood"),
  locationId: z.string().nullable().optional(),
});

export async function GET() {
  try {
    const user = await requireAuth();
    const stations = await prisma.station.findMany({
      where: { organizationId: user.organizationId, isActive: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(stations);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    requireRole(user, "admin", "director", "manager");
    const body = createStationSchema.parse(await req.json());

    const station = await prisma.station.create({
      data: {
        ...body,
        locationId: body.locationId || null,
        organizationId: user.organizationId,
      },
    });
    return NextResponse.json(station, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
