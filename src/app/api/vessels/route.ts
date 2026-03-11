import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError, parseBody, ApiError } from "@/lib/api-helpers";
import { createVesselSchema } from "@/lib/validations";
import { logActivity } from "@/lib/activity-logger";
import { checkVesselLimit } from "@/lib/plan-limits";

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

    const excludeStatuses = searchParams.get("excludeStatuses");

    const where: Record<string, unknown> = {
      organizationId: user.organizationId,
    };
    if (cultivarId) where.cultivarId = cultivarId;
    if (status) where.status = status;
    else if (excludeStatuses) where.status = { notIn: excludeStatuses.split(",") };
    if (healthStatus) where.healthStatus = healthStatus;
    if (stage) where.stage = stage;
    if (locationId) where.locationId = locationId;
    if (search) where.barcode = { contains: search, mode: "insensitive" };

    const [vessels, total, mediaPrepCount] = await Promise.all([
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
      prisma.vessel.count({
        where: { organizationId: user.organizationId, status: "media_filled" },
      }),
    ]);

    return NextResponse.json({ vessels, total, page, limit, mediaPrepCount });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    await checkVesselLimit(user.organizationId);
    const body = await parseBody(req, createVesselSchema);

    // Duplicate barcode prevention — allow reuse if previous vessel is disposed/multiplied
    const existing = await prisma.vessel.findFirst({
      where: { barcode: body.barcode, organizationId: user.organizationId },
      select: { id: true, barcode: true, status: true },
    });
    if (existing) {
      if (existing.status === "disposed" || existing.status === "multiplied") {
        // Archive the old vessel by appending a timestamp suffix to its barcode
        const archiveBarcode = `${existing.barcode}__archived_${Date.now()}`;
        await prisma.vessel.update({
          where: { id: existing.id },
          data: { barcode: archiveBarcode },
        });
        await logActivity({
          vesselId: existing.id,
          userId: user.id,
          type: "updated",
          category: "vessel",
          previousState: { barcode: body.barcode },
          newState: { barcode: archiveBarcode },
          notes: `Barcode ${body.barcode} freed for reuse — vessel archived`,
        });
      } else {
        throw new ApiError(
          `Barcode "${body.barcode}" is in use by an active vessel (status: ${existing.status}). Dispose the vessel first to reuse this barcode.`,
          409
        );
      }
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
