import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError, parseBody } from "@/lib/api-helpers";
import { createEnvironmentReadingSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    const locationId = searchParams.get("locationId");
    const hours = parseInt(searchParams.get("hours") || "168"); // default 7 days

    const since = new Date(Date.now() - hours * 3600000);

    const where: Record<string, unknown> = {
      location: { site: { organizationId: user.organizationId } },
      recordedAt: { gte: since },
    };
    if (locationId) where.locationId = locationId;

    const readings = await prisma.environmentReading.findMany({
      where,
      include: {
        location: { select: { id: true, name: true, type: true } },
        recordedBy: { select: { id: true, name: true } },
      },
      orderBy: { recordedAt: "desc" },
      take: 500,
    });

    return NextResponse.json(readings);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await parseBody(req, createEnvironmentReadingSchema);

    // Verify location belongs to org
    const location = await prisma.location.findFirst({
      where: { id: body.locationId, site: { organizationId: user.organizationId } },
    });
    if (!location) return NextResponse.json({ error: "Location not found" }, { status: 404 });

    const reading = await prisma.environmentReading.create({
      data: {
        locationId: body.locationId,
        temperature: body.temperature ?? null,
        humidity: body.humidity ?? null,
        co2Level: body.co2Level ?? null,
        lightLevel: body.lightLevel ?? null,
        source: "manual",
        recordedById: user.id,
      },
      include: {
        location: { select: { id: true, name: true } },
      },
    });

    // Check if out of range and create alert
    if (location.conditions) {
      const conditions = location.conditions as Record<string, number>;
      const alerts: string[] = [];
      if (body.temperature != null && conditions.temperature != null) {
        const diff = Math.abs(body.temperature - conditions.temperature);
        if (diff > 3) alerts.push(`Temperature ${body.temperature}°C (target: ${conditions.temperature}°C)`);
      }
      if (body.humidity != null && conditions.humidity != null) {
        const diff = Math.abs(body.humidity - conditions.humidity);
        if (diff > 10) alerts.push(`Humidity ${body.humidity}% (target: ${conditions.humidity}%)`);
      }
      if (alerts.length > 0) {
        await prisma.alert.create({
          data: {
            type: "environment_out_of_range",
            severity: "warning",
            title: `Environment out of range: ${location.name}`,
            message: alerts.join("; "),
            entityType: "location",
            entityId: location.id,
            organizationId: user.organizationId,
          },
        });
      }
    }

    return NextResponse.json(reading, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
