import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";

export interface ApiKeyUser {
  organizationId: string;
  apiKeyId: string;
  permissions: string[];
}

/**
 * Authenticate a request using an API key from the Authorization header.
 * Format: Authorization: Bearer vtrs_xxxxx
 */
export async function authenticateApiKey(req: NextRequest): Promise<ApiKeyUser | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const key = authHeader.slice(7);
  if (!key.startsWith("vtrs_")) return null;

  const keyHash = createHash("sha256").update(key).digest("hex");

  const apiKey = await prisma.apiKey.findFirst({
    where: {
      keyHash,
      isActive: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
  });

  if (!apiKey) return null;

  // Update last used
  await prisma.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() },
  });

  return {
    organizationId: apiKey.organizationId,
    apiKeyId: apiKey.id,
    permissions: apiKey.permissions as string[],
  };
}

/**
 * Require API key auth, returning 401 if not authenticated.
 */
export async function requireApiKey(req: NextRequest): Promise<ApiKeyUser> {
  const user = await authenticateApiKey(req);
  if (!user) {
    throw new ApiKeyError("Invalid or missing API key", 401);
  }
  return user;
}

export function hasPermission(user: ApiKeyUser, permission: string): boolean {
  const perms = user.permissions;
  if (perms.includes("*")) return true;
  if (perms.includes(permission)) return true;
  // Check wildcard (e.g. "vessels:*" matches "vessels:read")
  const [resource] = permission.split(":");
  return perms.includes(`${resource}:*`);
}

export class ApiKeyError extends Error {
  constructor(message: string, public status: number = 400) {
    super(message);
  }
}

export function handleApiKeyError(error: unknown) {
  if (error instanceof ApiKeyError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  console.error("API key error:", error);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

/**
 * Generate a new API key. Returns the raw key (only shown once) and its hash.
 */
export function generateApiKey(): { key: string; keyHash: string; keyPrefix: string } {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let random = "";
  for (let i = 0; i < 32; i++) {
    random += chars[Math.floor(Math.random() * chars.length)];
  }
  const key = `vtrs_${random}`;
  const keyHash = createHash("sha256").update(key).digest("hex");
  const keyPrefix = key.slice(0, 13); // "vtrs_" + 8 chars

  return { key, keyHash, keyPrefix };
}
