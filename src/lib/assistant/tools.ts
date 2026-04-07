import { prisma } from "@/lib/prisma";
import type { Tool } from "@anthropic-ai/sdk/resources/messages";

export const toolDefinitions: Tool[] = [
  {
    name: "query_vessels",
    description:
      "Query vessels in the lab. Use this to answer questions about vessel counts, contamination, health status, stages, and cultivar breakdowns.",
    input_schema: {
      type: "object" as const,
      properties: {
        status: { type: "string", description: "Filter by status: planted, growing, ready_to_multiply, multiplied, disposed, media_filled" },
        stage: { type: "string", description: "Filter by stage: initiation, multiplication, rooting, acclimation, hardening" },
        healthStatus: { type: "string", description: "Filter by health: healthy, stable, slow_growth, critical, dead" },
        cultivarName: { type: "string", description: "Filter by cultivar name (partial match)" },
        contaminationType: { type: "string", description: "Filter by contamination type: bacterial, fungal, viral, unknown" },
        limit: { type: "number", description: "Max results to return (default 20, max 50)" },
        includeStats: { type: "boolean", description: "Include aggregate stats (counts by stage, status, health)" },
      },
      required: [],
    },
  },
  {
    name: "query_cultivars",
    description:
      "Query cultivar/variety information. Use for questions about which cultivars exist, their species, multiplication rates, and vessel counts.",
    input_schema: {
      type: "object" as const,
      properties: {
        name: { type: "string", description: "Filter by cultivar name (partial match)" },
        species: { type: "string", description: "Filter by species" },
        includeVesselCounts: { type: "boolean", description: "Include vessel counts per cultivar and stage breakdown" },
      },
      required: [],
    },
  },
  {
    name: "query_contamination",
    description:
      "Analyze contamination incidents. Use for contamination rates, trends, breakdowns by type or cultivar.",
    input_schema: {
      type: "object" as const,
      properties: {
        daysBack: { type: "number", description: "How many days back to look (default 30)" },
        cultivarName: { type: "string", description: "Filter by cultivar name" },
        contaminationType: { type: "string", description: "Filter by type: bacterial, fungal, viral, unknown" },
        groupBy: { type: "string", description: "Group results by: cultivar, type, location" },
      },
      required: [],
    },
  },
  {
    name: "query_tech_performance",
    description:
      "Query technician performance data including vessels processed, contamination rates, points, and bonus calculations.",
    input_schema: {
      type: "object" as const,
      properties: {
        period: { type: "string", description: "Time period: today, week, month (default: week)" },
        techName: { type: "string", description: "Filter by technician name" },
      },
      required: [],
    },
  },
  {
    name: "query_clone_lines",
    description:
      "Query clone line data including lineage, pathogen test results, and vessel counts per line.",
    input_schema: {
      type: "object" as const,
      properties: {
        status: { type: "string", description: "Filter by status: active, quarantined, retired, testing" },
        cultivarName: { type: "string", description: "Filter by cultivar name" },
        includeTestResults: { type: "boolean", description: "Include recent pathogen test results" },
      },
      required: [],
    },
  },
  {
    name: "query_forecasting",
    description:
      "Get current vessel inventory by stage for production forecasting and projections.",
    input_schema: {
      type: "object" as const,
      properties: {
        cultivarName: { type: "string", description: "Filter by cultivar name for cultivar-specific forecast" },
      },
      required: [],
    },
  },
  {
    name: "query_demand_planning",
    description:
      "Query sales orders and demand planning data. Shows order pipeline, fulfillment status, and demand gaps.",
    input_schema: {
      type: "object" as const,
      properties: {
        status: { type: "string", description: "Filter by order status: pending, confirmed, in_progress, fulfilled, cancelled" },
        cultivarName: { type: "string", description: "Filter by cultivar name" },
      },
      required: [],
    },
  },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ToolParams = Record<string, any>;

export async function executeTool(
  name: string,
  params: ToolParams,
  organizationId: string
): Promise<unknown> {
  switch (name) {
    case "query_vessels":
      return executeQueryVessels(params, organizationId);
    case "query_cultivars":
      return executeQueryCultivars(params, organizationId);
    case "query_contamination":
      return executeQueryContamination(params, organizationId);
    case "query_tech_performance":
      return executeQueryTechPerformance(params, organizationId);
    case "query_clone_lines":
      return executeQueryCloneLines(params, organizationId);
    case "query_forecasting":
      return executeQueryForecasting(params, organizationId);
    case "query_demand_planning":
      return executeQueryDemandPlanning(params, organizationId);
    default:
      return { error: `Unknown tool: ${name}` };
  }
}

async function executeQueryVessels(params: ToolParams, organizationId: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { organizationId };
  if (params.status) where.status = params.status;
  if (params.stage) where.stage = params.stage;
  if (params.healthStatus) where.healthStatus = params.healthStatus;
  if (params.contaminationType) where.contaminationType = params.contaminationType;
  if (params.cultivarName) where.cultivar = { name: { contains: params.cultivarName, mode: "insensitive" } };

  const limit = Math.min(params.limit || 20, 50);

  const vessels = await prisma.vessel.findMany({
    where,
    include: { cultivar: { select: { name: true, code: true } }, location: { select: { name: true } }, cloneLine: { select: { name: true, code: true } } },
    orderBy: { updatedAt: "desc" },
    take: limit,
  });

  const result: Record<string, unknown> = {
    vessels: vessels.map((v) => ({
      barcode: v.barcode,
      cultivar: v.cultivar?.name,
      stage: v.stage,
      status: v.status,
      health: v.healthStatus,
      location: v.location?.name,
      cloneLine: v.cloneLine?.name,
      generation: v.generation,
      subcultureNumber: v.subcultureNumber,
      contaminationType: v.contaminationType,
      plantedAt: v.plantedAt?.toISOString().split("T")[0],
    })),
    count: vessels.length,
  };

  if (params.includeStats) {
    const total = await prisma.vessel.count({ where: { organizationId, status: { notIn: ["disposed"] } } });
    const byStage = await prisma.vessel.groupBy({ by: ["stage"], _count: true, where: { organizationId, status: { notIn: ["disposed"] } } });
    const byStatus = await prisma.vessel.groupBy({ by: ["status"], _count: true, where: { organizationId } });
    const byHealth = await prisma.vessel.groupBy({ by: ["healthStatus"], _count: true, where: { organizationId, status: { notIn: ["disposed"] } } });

    result.stats = {
      totalActive: total,
      byStage: Object.fromEntries(byStage.map((s) => [s.stage, s._count])),
      byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count])),
      byHealth: Object.fromEntries(byHealth.map((s) => [s.healthStatus, s._count])),
    };
  }

  return result;
}

async function executeQueryCultivars(params: ToolParams, organizationId: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { organizationId };
  if (params.name) where.name = { contains: params.name, mode: "insensitive" };
  if (params.species) where.species = { contains: params.species, mode: "insensitive" };

  const cultivars = await prisma.cultivar.findMany({
    where,
    include: params.includeVesselCounts ? { _count: { select: { vessels: true } } } : undefined,
  });

  const result = cultivars.map((c) => ({
    name: c.name,
    code: c.code,
    species: c.species,
    strain: c.strain,
    targetMultiplicationRate: c.targetMultiplicationRate,
    stageConfig: c.stageConfig,
    vesselCount: (c as Record<string, unknown>)._count
      ? ((c as Record<string, unknown>)._count as Record<string, number>).vessels
      : undefined,
  }));

  return { cultivars: result, count: result.length };
}

async function executeQueryContamination(params: ToolParams, organizationId: string) {
  const daysBack = params.daysBack || 30;
  const since = new Date(Date.now() - daysBack * 86400000);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {
    organizationId,
    contaminationDate: { not: null, gte: since },
  };
  if (params.cultivarName) where.cultivar = { name: { contains: params.cultivarName, mode: "insensitive" } };
  if (params.contaminationType) where.contaminationType = params.contaminationType;

  const contaminated = await prisma.vessel.findMany({
    where,
    include: { cultivar: { select: { name: true } }, location: { select: { name: true } } },
  });

  const totalActive = await prisma.vessel.count({ where: { organizationId, status: { notIn: ["disposed"] } } });
  const rate = totalActive > 0 ? ((contaminated.length / totalActive) * 100).toFixed(1) : "0";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let grouped: Record<string, number> = {};
  if (params.groupBy === "cultivar") {
    contaminated.forEach((v) => { const k = v.cultivar?.name || "Unknown"; grouped[k] = (grouped[k] || 0) + 1; });
  } else if (params.groupBy === "type") {
    contaminated.forEach((v) => { const k = v.contaminationType || "Unknown"; grouped[k] = (grouped[k] || 0) + 1; });
  } else if (params.groupBy === "location") {
    contaminated.forEach((v) => { const k = v.location?.name || "Unknown"; grouped[k] = (grouped[k] || 0) + 1; });
  }

  return {
    contaminatedCount: contaminated.length,
    totalActiveVessels: totalActive,
    contaminationRate: `${rate}%`,
    daysBack,
    grouped: Object.keys(grouped).length > 0 ? grouped : undefined,
    incidents: contaminated.slice(0, 20).map((v) => ({
      barcode: v.barcode,
      cultivar: v.cultivar?.name,
      type: v.contaminationType,
      date: v.contaminationDate?.toISOString().split("T")[0],
      location: v.location?.name,
    })),
  };
}

async function executeQueryTechPerformance(params: ToolParams, organizationId: string) {
  const period = params.period || "week";
  const now = new Date();
  let since: Date;
  if (period === "today") since = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  else if (period === "month") since = new Date(now.getTime() - 30 * 86400000);
  else since = new Date(now.getTime() - 7 * 86400000);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const shiftWhere: any = {
    organizationId,
    clockIn: { gte: since },
  };

  const shifts = await prisma.techShift.findMany({
    where: shiftWhere,
    include: { user: { select: { name: true, email: true } } },
  });

  // Aggregate by tech
  const techMap: Record<string, { name: string; vessels: number; points: number; contamination: number; hours: number; shifts: number }> = {};
  for (const shift of shifts) {
    const name = shift.user.name || shift.user.email;
    if (params.techName && !name.toLowerCase().includes(params.techName.toLowerCase())) continue;
    if (!techMap[name]) techMap[name] = { name, vessels: 0, points: 0, contamination: 0, hours: 0, shifts: 0 };
    techMap[name].vessels += shift.vesselsProcessed || 0;
    techMap[name].points += shift.totalPoints || 0;
    techMap[name].contamination += shift.contaminationCount || 0;
    techMap[name].hours += shift.hoursWorked || 0;
    techMap[name].shifts += 1;
  }

  const techs = Object.values(techMap).map((t) => ({
    ...t,
    contaminationRate: t.vessels > 0 ? `${((t.contamination / t.vessels) * 100).toFixed(1)}%` : "0%",
    vesselsPerHour: t.hours > 0 ? (t.vessels / t.hours).toFixed(1) : "0",
  }));

  techs.sort((a, b) => b.vessels - a.vessels);

  return { period, techs, totalTechs: techs.length };
}

async function executeQueryCloneLines(params: ToolParams, organizationId: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { organizationId };
  if (params.status) where.status = params.status;
  if (params.cultivarName) where.cultivar = { name: { contains: params.cultivarName, mode: "insensitive" } };

  const lines = await prisma.cloneLine.findMany({
    where,
    include: {
      cultivar: { select: { name: true } },
      _count: { select: { vessels: true } },
      pathogenTests: params.includeTestResults
        ? { orderBy: { testDate: "desc" }, take: 3, select: { testDate: true, result: true, pathogen: true, labName: true, assayType: true } }
        : undefined,
    },
  });

  return {
    cloneLines: lines.map((l) => ({
      name: l.name,
      code: l.code,
      lineNumber: l.lineNumber,
      cultivar: l.cultivar?.name,
      status: l.status,
      vesselCount: l._count.vessels,
      lastTestedAt: l.lastTestedAt?.toISOString().split("T")[0],
      lastTestResult: l.lastTestResult,
      notes: l.notes,
      recentTests: (l as Record<string, unknown>).pathogenTests || undefined,
    })),
    count: lines.length,
  };
}

async function executeQueryForecasting(params: ToolParams, organizationId: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const vesselWhere: any = { organizationId, status: { notIn: ["disposed", "multiplied", "media_filled"] } };
  if (params.cultivarName) vesselWhere.cultivar = { name: { contains: params.cultivarName, mode: "insensitive" } };

  const byStage = await prisma.vessel.groupBy({
    by: ["stage"],
    _count: true,
    where: vesselWhere,
  });

  const total = await prisma.vessel.count({ where: vesselWhere });

  const stageBreakdown = Object.fromEntries(byStage.map((s) => [s.stage, s._count]));

  return {
    cultivarFilter: params.cultivarName || "all",
    totalActiveVessels: total,
    byStage: stageBreakdown,
    summary: `Currently ${total} active vessels: ${stageBreakdown["initiation"] || 0} in initiation, ${stageBreakdown["multiplication"] || 0} in multiplication, ${stageBreakdown["rooting"] || 0} in rooting, ${stageBreakdown["acclimation"] || 0} in acclimation, ${stageBreakdown["hardening"] || 0} in hardening.`,
  };
}

async function executeQueryDemandPlanning(params: ToolParams, organizationId: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = { organizationId };
  if (params.status && params.status !== "all") where.status = params.status;
  if (params.cultivarName) where.cultivar = { name: { contains: params.cultivarName, mode: "insensitive" } };

  const orders = await prisma.salesOrder.findMany({
    where,
    include: { cultivar: { select: { name: true } } },
    orderBy: { dueDate: "asc" },
  });

  return {
    orders: orders.map((o) => ({
      orderNumber: o.orderNumber,
      customer: o.customerName,
      cultivar: o.cultivar?.name,
      quantity: o.quantity,
      unitType: o.unitType,
      dueDate: o.dueDate?.toISOString().split("T")[0],
      status: o.status,
      priority: o.priority,
    })),
    count: orders.length,
  };
}
