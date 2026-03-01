import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/api-helpers";
import { logActivity } from "@/lib/activity-logger";
import { z } from "zod";

const pourSchema = z.object({
  barcodes: z.array(z.string().min(1)).min(1, "At least one barcode is required"),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const body = pourSchema.parse(await req.json());

    // Verify batch exists and belongs to user's org
    const batch = await prisma.mediaBatch.findFirst({
      where: { id, recipe: { organizationId: user.organizationId } },
      include: { recipe: { select: { id: true, name: true } } },
    });

    if (!batch) {
      return NextResponse.json({ error: "Media batch not found" }, { status: 404 });
    }

    const results: { barcode: string; status: string; vesselId?: string }[] = [];

    for (const barcode of body.barcodes) {
      try {
        // Check if vessel already exists
        let vessel = await prisma.vessel.findUnique({ where: { barcode } });

        if (vessel) {
          // Verify it belongs to same org
          if (vessel.organizationId !== user.organizationId) {
            results.push({ barcode, status: "error: belongs to different organization" });
            continue;
          }
          // Update existing vessel with batch info
          vessel = await prisma.vessel.update({
            where: { id: vessel.id },
            data: {
              mediaBatch: { connect: { id: batch.id } },
              mediaRecipe: { connect: { id: batch.recipeId } },
              status: "media_filled",
            },
          });

          await logActivity({
            type: "media_filled",
            vesselId: vessel.id,
            userId: user.id,
            newState: { mediaBatchId: batch.id, batchNumber: batch.batchNumber, recipe: batch.recipe.name },
          });

          results.push({ barcode, status: "updated", vesselId: vessel.id });
        } else {
          // Create new vessel with batch info
          vessel = await prisma.vessel.create({
            data: {
              barcode,
              mediaBatch: { connect: { id: batch.id } },
              mediaRecipe: { connect: { id: batch.recipeId } },
              status: "media_filled",
              organization: { connect: { id: user.organizationId } },
            },
          });

          await logActivity({
            type: "created",
            vesselId: vessel.id,
            userId: user.id,
            newState: { mediaBatchId: batch.id, batchNumber: batch.batchNumber, recipe: batch.recipe.name },
          });

          results.push({ barcode, status: "created", vesselId: vessel.id });
        }
      } catch {
        results.push({ barcode, status: "error" });
      }
    }

    return NextResponse.json({
      batchId: batch.id,
      batchNumber: batch.batchNumber,
      results,
      created: results.filter((r) => r.status === "created").length,
      updated: results.filter((r) => r.status === "updated").length,
      errors: results.filter((r) => r.status.startsWith("error")).length,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
