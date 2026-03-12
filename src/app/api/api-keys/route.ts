import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireRole, handleApiError } from "@/lib/api-helpers";
import { generateApiKey } from "@/lib/api-key-auth";
import { z } from "zod";

const createApiKeySchema = z.object({
  name: z.string().min(1, "Name is required"),
  permissions: z.array(z.string()).min(1, "At least one permission is required"),
  expiresInDays: z.number().int().positive().nullable().optional(),
});

export async function GET() {
  try {
    const user = await requireAuth();
    requireRole(user, "admin", "manager");

    const keys = await prisma.apiKey.findMany({
      where: { organizationId: user.organizationId },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        permissions: true,
        lastUsedAt: true,
        expiresAt: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(keys);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    requireRole(user, "admin", "manager");

    const body = createApiKeySchema.parse(await req.json());
    const { key, keyHash, keyPrefix } = generateApiKey();

    let expiresAt: Date | null = null;
    if (body.expiresInDays) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + body.expiresInDays);
    }

    const apiKey = await prisma.apiKey.create({
      data: {
        name: body.name,
        keyHash,
        keyPrefix,
        permissions: body.permissions,
        expiresAt,
        organizationId: user.organizationId,
      },
    });

    return NextResponse.json(
      {
        id: apiKey.id,
        name: apiKey.name,
        key, // Only returned once on creation
        keyPrefix,
        permissions: apiKey.permissions,
        expiresAt: apiKey.expiresAt,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
