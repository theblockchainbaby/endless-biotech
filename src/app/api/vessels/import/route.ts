import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError, ApiError } from "@/lib/api-helpers";
import { logActivity } from "@/lib/activity-logger";
import { VESSEL_STATUSES, HEALTH_STATUSES, STAGES } from "@/lib/constants";

interface CsvRow {
  barcode: string;
  cultivar?: string;
  stage?: string;
  explantCount?: string;
  healthStatus?: string;
  status?: string;
  notes?: string;
}

function parseCsv(text: string): CsvRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) throw new ApiError("CSV must have a header row and at least one data row", 400);

  const headerRaw = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/[^a-z_]/g, ""));
  const headerMap: Record<string, string> = {};
  for (const h of headerRaw) {
    if (h.includes("barcode") || h === "code" || h === "id") headerMap[h] = "barcode";
    else if (h.includes("cultivar") || h === "strain" || h === "variety") headerMap[h] = "cultivar";
    else if (h === "stage") headerMap[h] = "stage";
    else if (h.includes("explant") || h === "count") headerMap[h] = "explantCount";
    else if (h.includes("health")) headerMap[h] = "healthStatus";
    else if (h === "status") headerMap[h] = "status";
    else if (h.includes("note")) headerMap[h] = "notes";
  }

  if (!Object.values(headerMap).includes("barcode")) {
    throw new ApiError("CSV must have a 'barcode' column", 400);
  }

  const rows: CsvRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim());
    const row: Record<string, string> = {};
    headerRaw.forEach((h, idx) => {
      const mapped = headerMap[h];
      if (mapped && values[idx]) {
        row[mapped] = values[idx];
      }
    });
    if (row.barcode) {
      rows.push(row as unknown as CsvRow);
    }
  }

  return rows;
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const csvText = body.csv as string;

    if (!csvText || typeof csvText !== "string") {
      throw new ApiError("CSV data is required", 400);
    }

    const rows = parseCsv(csvText);
    if (rows.length === 0) {
      throw new ApiError("No valid rows found in CSV", 400);
    }
    if (rows.length > 2000) {
      throw new ApiError("Maximum 2,000 vessels per import. Split your CSV into smaller batches.", 400);
    }

    // Check for duplicate barcodes within the CSV
    const barcodes = rows.map((r) => r.barcode);
    const uniqueBarcodes = new Set(barcodes);
    if (uniqueBarcodes.size !== barcodes.length) {
      throw new ApiError("CSV contains duplicate barcodes", 400);
    }

    // Check for existing barcodes in the database
    const existing = await prisma.vessel.findMany({
      where: { barcode: { in: barcodes }, organizationId: user.organizationId },
      select: { barcode: true },
    });
    if (existing.length > 0) {
      const dupes = existing.map((e) => e.barcode).join(", ");
      throw new ApiError(`These barcodes already exist: ${dupes}`, 409);
    }

    // Resolve cultivar names to IDs
    const cultivarNames = [...new Set(rows.map((r) => r.cultivar).filter(Boolean))] as string[];
    const cultivarMap: Record<string, string> = {};
    if (cultivarNames.length > 0) {
      const cultivars = await prisma.cultivar.findMany({
        where: {
          organizationId: user.organizationId,
          name: { in: cultivarNames, mode: "insensitive" },
        },
        select: { id: true, name: true },
      });
      for (const c of cultivars) {
        cultivarMap[c.name.toLowerCase()] = c.id;
      }
    }

    // Validate and create vessels
    const validStatuses = VESSEL_STATUSES as readonly string[];
    const validHealth = HEALTH_STATUSES as readonly string[];
    const validStages = STAGES as readonly string[];

    const results: { barcode: string; success: boolean; error?: string }[] = [];
    let created = 0;

    for (const row of rows) {
      try {
        const stage = row.stage && validStages.includes(row.stage) ? row.stage : "initiation";
        const status = row.status && validStatuses.includes(row.status) ? row.status : "planted";
        const healthStatus = row.healthStatus && validHealth.includes(row.healthStatus) ? row.healthStatus : "healthy";
        const explantCount = row.explantCount ? parseInt(row.explantCount) || 0 : 0;
        const cultivarId = row.cultivar ? cultivarMap[row.cultivar.toLowerCase()] || null : null;

        const vessel = await prisma.vessel.create({
          data: {
            barcode: row.barcode,
            cultivarId,
            explantCount,
            healthStatus,
            status,
            stage,
            notes: row.notes || null,
            organizationId: user.organizationId,
          },
        });

        await logActivity({
          vesselId: vessel.id,
          userId: user.id,
          type: "created",
          category: "vessel",
          newState: { status, stage, healthStatus },
          metadata: { source: "csv_import" },
          notes: `Imported from CSV: ${row.barcode}`,
        });

        results.push({ barcode: row.barcode, success: true });
        created++;
      } catch {
        results.push({ barcode: row.barcode, success: false, error: "Failed to create vessel" });
      }
    }

    return NextResponse.json({
      total: rows.length,
      created,
      failed: rows.length - created,
      results,
    }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
