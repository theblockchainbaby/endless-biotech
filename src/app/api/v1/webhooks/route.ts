import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requireApiKey, hasPermission, handleApiKeyError } from "@/lib/api-key-auth";
import { randomBytes } from "crypto";
import { z } from "zod";

const createWebhookSchema = z.object({
  url: z.string().url("Valid URL is required"),
  events: z.array(z.string()).min(1, "At least one event is required"),
});

export async function GET(req: NextRequest) {
  try {
    const apiUser = await requireApiKey(req);
    if (!hasPermission(apiUser, "webhooks:read")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const endpoints = await prisma.webhookEndpoint.findMany({
      where: { organizationId: apiUser.organizationId },
      select: {
        id: true,
        url: true,
        events: true,
        isActive: true,
        lastDeliveredAt: true,
        failureCount: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: endpoints });
  } catch (error) {
    return handleApiKeyError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const apiUser = await requireApiKey(req);
    if (!hasPermission(apiUser, "webhooks:write")) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = createWebhookSchema.parse(await req.json());
    const secret = randomBytes(32).toString("hex");

    const endpoint = await prisma.webhookEndpoint.create({
      data: {
        url: body.url,
        events: body.events,
        secret,
        organizationId: apiUser.organizationId,
      },
    });

    return NextResponse.json(
      {
        data: {
          id: endpoint.id,
          url: endpoint.url,
          events: endpoint.events,
          secret, // Only returned on creation
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiKeyError(error);
  }
}
