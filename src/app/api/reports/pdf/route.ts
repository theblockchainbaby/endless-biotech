import { prisma } from "@/lib/prisma";
import { requireAuth, handleApiError } from "@/lib/api-helpers";
import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import {
  VesselReport,
  ProductionReport,
  ContaminationReport,
  ActivityReport,
} from "@/lib/pdf-templates";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const orgId = user.organizationId;
    const type = req.nextUrl.searchParams.get("type") || "vessels";

    let pdfBuffer: Buffer;
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];

    switch (type) {
      case "vessels": {
        const vessels = await prisma.vessel.findMany({
          where: { organizationId: orgId },
          include: {
            cultivar: { select: { name: true, species: true } },
            location: { select: { name: true } },
            mediaRecipe: { select: { name: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 500,
        });

        const org = await prisma.organization.findUnique({
          where: { id: orgId },
          select: { name: true },
        });

        pdfBuffer = await renderToBuffer(
          VesselReport({
            orgName: org?.name || "Organization",
            date: dateStr,
            vessels: vessels.map((v) => ({
              barcode: v.barcode,
              cultivar: v.cultivar?.name || "—",
              species: v.cultivar?.species || "—",
              stage: v.stage,
              status: v.status,
              health: v.healthStatus,
              location: v.location?.name || "—",
              explants: v.explantCount,
              generation: v.generation,
              subcultureNum: v.subcultureNumber,
              mediaRecipe: v.mediaRecipe?.name || "—",
              created: v.createdAt.toISOString().split("T")[0],
            })),
          })
        );
        break;
      }

      case "production": {
        const org = await prisma.organization.findUnique({
          where: { id: orgId },
          select: { name: true },
        });

        const [
          totalVessels,
          activeVessels,
          totalExplants,
          vesselsByStage,
          vesselsByCultivar,
          contaminatedCount,
          multipliedCount,
        ] = await Promise.all([
          prisma.vessel.count({ where: { organizationId: orgId } }),
          prisma.vessel.count({
            where: { organizationId: orgId, status: { notIn: ["disposed", "multiplied"] } },
          }),
          prisma.vessel.aggregate({
            where: { organizationId: orgId, status: { notIn: ["disposed"] } },
            _sum: { explantCount: true },
          }),
          prisma.vessel.groupBy({
            by: ["stage"],
            where: { organizationId: orgId, status: { notIn: ["disposed", "multiplied"] } },
            _count: true,
          }),
          prisma.vessel.groupBy({
            by: ["cultivarId"],
            where: { organizationId: orgId, status: { notIn: ["disposed", "multiplied"] } },
            _count: true,
            _sum: { explantCount: true },
          }),
          prisma.vessel.count({
            where: { organizationId: orgId, contaminationType: { not: null } },
          }),
          prisma.vessel.count({
            where: { organizationId: orgId, status: "multiplied" },
          }),
        ]);

        const cultivarIds = vesselsByCultivar.map((c) => c.cultivarId).filter(Boolean) as string[];
        const cultivars = await prisma.cultivar.findMany({
          where: { id: { in: cultivarIds } },
          select: { id: true, name: true },
        });
        const cultivarMap = new Map(cultivars.map((c) => [c.id, c.name]));

        const contaminationRate = totalVessels > 0
          ? ((contaminatedCount / totalVessels) * 100).toFixed(1)
          : "0";
        const multiplicationRate = totalVessels > 0
          ? ((multipliedCount / totalVessels) * 100).toFixed(1)
          : "0";

        pdfBuffer = await renderToBuffer(
          ProductionReport({
            orgName: org?.name || "Organization",
            date: dateStr,
            totalVessels,
            activeVessels,
            totalExplants: totalExplants._sum.explantCount || 0,
            contaminationRate: `${contaminationRate}%`,
            multiplicationRate: `${multiplicationRate}%`,
            vesselsByStage: vesselsByStage.map((s) => ({
              stage: s.stage,
              count: s._count,
            })),
            vesselsByCultivar: vesselsByCultivar.map((c) => ({
              cultivar: cultivarMap.get(c.cultivarId || "") || "Unknown",
              count: c._count,
              explants: c._sum.explantCount || 0,
            })),
          })
        );
        break;
      }

      case "contamination": {
        const org = await prisma.organization.findUnique({
          where: { id: orgId },
          select: { name: true },
        });

        const threeMonthsAgo = new Date(now);
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

        const [byType, byCultivar, totalVessels, contaminatedCount] = await Promise.all([
          prisma.vessel.groupBy({
            by: ["contaminationType"],
            where: {
              organizationId: orgId,
              contaminationDate: { gte: threeMonthsAgo },
              contaminationType: { not: null },
            },
            _count: true,
          }),
          prisma.vessel.groupBy({
            by: ["cultivarId"],
            where: {
              organizationId: orgId,
              contaminationType: { not: null },
              contaminationDate: { gte: threeMonthsAgo },
            },
            _count: true,
          }),
          prisma.vessel.count({
            where: { organizationId: orgId, createdAt: { gte: threeMonthsAgo } },
          }),
          prisma.vessel.count({
            where: {
              organizationId: orgId,
              contaminationType: { not: null },
              contaminationDate: { gte: threeMonthsAgo },
            },
          }),
        ]);

        const cultivarIds = byCultivar.map((c) => c.cultivarId).filter(Boolean) as string[];
        const cultivars = await prisma.cultivar.findMany({
          where: { id: { in: cultivarIds } },
          select: { id: true, name: true },
        });
        const cultivarMap = new Map(cultivars.map((c) => [c.id, c.name]));

        const overallRate = totalVessels > 0
          ? ((contaminatedCount / totalVessels) * 100).toFixed(1)
          : "0";

        pdfBuffer = await renderToBuffer(
          ContaminationReport({
            orgName: org?.name || "Organization",
            date: dateStr,
            period: "Last 3 Months",
            overallRate: `${overallRate}%`,
            totalContaminated: contaminatedCount,
            totalVessels,
            byType: byType.map((t) => ({
              type: t.contaminationType || "Unknown",
              count: t._count,
            })),
            byCultivar: byCultivar.map((c) => ({
              cultivar: cultivarMap.get(c.cultivarId || "") || "Unknown",
              count: c._count,
            })),
          })
        );
        break;
      }

      case "activity": {
        const org = await prisma.organization.findUnique({
          where: { id: orgId },
          select: { name: true },
        });

        const activities = await prisma.activity.findMany({
          where: {
            OR: [
              { vessel: { organizationId: orgId } },
              { user: { organizationId: orgId } },
            ],
          },
          include: {
            vessel: { select: { barcode: true } },
            user: { select: { name: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 500,
        });

        pdfBuffer = await renderToBuffer(
          ActivityReport({
            orgName: org?.name || "Organization",
            date: dateStr,
            activities: activities.map((a) => ({
              type: a.type,
              category: a.category,
              vessel: a.vessel?.barcode || "—",
              user: a.user?.name || "—",
              notes: a.notes || "",
              date: a.createdAt.toISOString().replace("T", " ").slice(0, 16),
            })),
          })
        );
        break;
      }

      default:
        return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
    }

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="vitros-${type}-report-${dateStr}.pdf"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
