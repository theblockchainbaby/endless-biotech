import { prisma } from "./prisma";
import { Prisma } from "@prisma/client";

interface LogActivityParams {
  vesselId?: string;
  userId?: string;
  type: string;
  category?: string;
  previousState?: Record<string, unknown>;
  newState?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  notes?: string;
}

export async function logActivity(params: LogActivityParams) {
  return prisma.activity.create({
    data: {
      vesselId: params.vesselId || null,
      userId: params.userId || null,
      type: params.type,
      category: params.category || "vessel",
      previousState: (params.previousState as Prisma.InputJsonValue) ?? Prisma.JsonNull,
      newState: (params.newState as Prisma.InputJsonValue) ?? Prisma.JsonNull,
      metadata: (params.metadata as Prisma.InputJsonValue) ?? Prisma.JsonNull,
      notes: params.notes || null,
    },
  });
}

export function buildStateSnapshot(
  obj: Record<string, unknown>,
  keys: string[]
): Record<string, unknown> {
  const snapshot: Record<string, unknown> = {};
  for (const key of keys) {
    if (key in obj) {
      snapshot[key] = obj[key];
    }
  }
  return snapshot;
}
