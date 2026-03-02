import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError, parseBody, ApiError } from "@/lib/api-helpers";
import { createVesselSchema } from "@/lib/validations";
import { logActivity } from "@/lib/activity-logger";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    const cultivarId = searchParams.get("cultivarId");
    const status = searchParams.get("status");
    const healthStatus = searchParams.get("healthStatus");
    const stage = searchParams.get("stage");
    const locationId = searchParams.get("locationId");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: Record<string, unknown> = {
      organizationId: user.organizationId,
    };
    if (cultivarId) where.cultivarId = cultivarId;
    if (status) where.status = status;
    if (healthStatus) where.healthStatus = healthStatus;
    if (stage) where.stage = stage;
    if (locationId) where.locationId = locationId;
    if (search) where.barcode = { contains: search, mode: "insensitive" };

    const [vessels, total] = await Promise.all([
      prisma.vessel.findMany({
        where,
        include: {
          cultivar: true,
          location: true,
          mediaRecipe: true,
          parentVessel: { select: { id: true, barcode: true } },
        },
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.vessel.count({ where }),
    ]);

    return NextResponse.json({ vessels, total, page, limit });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await parseBody(req, createVesselSchema);

    // Duplicate barcode prevention
    const existing = await prisma.vessel.findFirst({
      where: { barcode: body.barcode, organizationId: user.organizationId },
      select: { id: true, barcode: true, status: true },
    });
    if (existing) {
      throw new ApiError(
        `Barcode "${body.barcode}" already exists (status: ${existing.status}). Each vessel must have a unique barcode.`,
        409
      );
    }

    const vessel = await prisma.vessel.create({
      data: {
        barcode: body.barcode,
        cultivarId: body.cultivarId || null,
        mediaRecipeId: body.mediaRecipeId || null,
        locationId: body.locationId || null,
        explantCount: body.explantCount,
        healthStatus: body.healthStatus,
        status: body.status,
        stage: body.stage,
        notes: body.notes || null,
        organizationId: user.organizationId,
      },
      include: { cultivar: true, location: true, mediaRecipe: true },
    });

    await logActivity({
      vesselId: vessel.id,
      userId: user.id,
      type: "created",
      category: "vessel",
      newState: { status: vessel.status, stage: vessel.stage, healthStatus: vessel.healthStatus },
      notes: `Vessel ${body.barcode} created`,
    });

    return NextResponse.json(vessel, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
