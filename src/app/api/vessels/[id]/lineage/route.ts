import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleApiError } from "@/lib/api-helpers";
import type { LineageNode } from "@/lib/types";

const MAX_DEPTH = 20;
const MAX_TOTAL_NODES = 5000;

const vesselSelect = {
  id: true,
  barcode: true,
  stage: true,
  status: true,
  healthStatus: true,
  generation: true,
  subcultureNumber: true,
  explantCount: true,
  createdAt: true,
  parentVesselId: true,
  cultivar: { select: { name: true } },
} as const;

function toNode(vessel: {
  id: string;
  barcode: string;
  stage: string;
  status: string;
  healthStatus: string;
  generation: number;
  subcultureNumber: number;
  explantCount: number;
  createdAt: Date;
  cultivar: { name: string } | null;
}): LineageNode {
  return {
    id: vessel.id,
    barcode: vessel.barcode,
    cultivarName: vessel.cultivar?.name ?? null,
    stage: vessel.stage,
    status: vessel.status,
    healthStatus: vessel.healthStatus,
    generation: vessel.generation,
    subcultureNumber: vessel.subcultureNumber,
    explantCount: vessel.explantCount,
    createdAt: vessel.createdAt.toISOString(),
    children: [],
  };
}

async function findRoot(vesselId: string, organizationId: string): Promise<string> {
  let currentId = vesselId;

  for (let i = 0; i < MAX_DEPTH; i++) {
    const vessel = await prisma.vessel.findFirst({
      where: { id: currentId, organizationId },
      select: { id: true, parentVesselId: true },
    });
    if (!vessel) return currentId;
    if (!vessel.parentVesselId) return vessel.id;
    currentId = vessel.parentVesselId;
  }

  return currentId;
}

async function buildTree(rootId: string, organizationId: string) {
  const rootVessel = await prisma.vessel.findFirst({
    where: { id: rootId, organizationId },
    select: vesselSelect,
  });

  if (!rootVessel) {
    return { root: null, totalNodes: 0, maxGeneration: 0, truncated: false };
  }

  const rootNode = toNode(rootVessel);
  const nodeMap = new Map<string, LineageNode>();
  nodeMap.set(rootVessel.id, rootNode);

  let totalNodes = 1;
  let maxGeneration = rootVessel.generation;
  let truncated = false;
  let currentLevelIds = [rootId];

  while (currentLevelIds.length > 0) {
    const children = await prisma.vessel.findMany({
      where: {
        parentVesselId: { in: currentLevelIds },
        organizationId,
      },
      select: vesselSelect,
      orderBy: { barcode: "asc" },
    });

    if (children.length === 0) break;

    const nextLevelIds: string[] = [];

    for (const child of children) {
      if (totalNodes >= MAX_TOTAL_NODES) {
        truncated = true;
        break;
      }

      const childNode = toNode(child);
      nodeMap.set(child.id, childNode);

      const parent = nodeMap.get(child.parentVesselId!);
      if (parent) parent.children.push(childNode);

      nextLevelIds.push(child.id);
      totalNodes++;
      if (child.generation > maxGeneration) maxGeneration = child.generation;
    }

    if (truncated) break;
    currentLevelIds = nextLevelIds;
  }

  return { root: rootNode, totalNodes, maxGeneration, truncated };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const vessel = await prisma.vessel.findFirst({
      where: { id, organizationId: user.organizationId },
      select: { id: true },
    });

    if (!vessel) {
      return NextResponse.json({ error: "Vessel not found" }, { status: 404 });
    }

    const rootId = await findRoot(id, user.organizationId);
    const { root, totalNodes, maxGeneration, truncated } = await buildTree(
      rootId,
      user.organizationId
    );

    if (!root) {
      return NextResponse.json({ error: "Root vessel not found" }, { status: 404 });
    }

    return NextResponse.json({
      root,
      totalNodes,
      maxGeneration,
      currentVesselId: id,
      truncated,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
