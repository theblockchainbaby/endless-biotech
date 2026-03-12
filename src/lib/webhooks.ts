import { prisma } from "@/lib/prisma";
import { createHmac } from "crypto";

export type WebhookEvent =
  | "vessel.created"
  | "vessel.multiplied"
  | "vessel.stage_advanced"
  | "vessel.health_updated"
  | "vessel.disposed"
  | "order.created"
  | "order.fulfilled"
  | "order.updated";

interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  data: Record<string, unknown>;
}

/**
 * Dispatch a webhook event to all matching endpoints for an organization.
 * Runs in the background (fire-and-forget).
 */
export async function dispatchWebhook(
  organizationId: string,
  event: WebhookEvent,
  data: Record<string, unknown>
) {
  try {
    const endpoints = await prisma.webhookEndpoint.findMany({
      where: {
        organizationId,
        isActive: true,
      },
    });

    const matchingEndpoints = endpoints.filter((ep) => {
      const events = ep.events as string[];
      return events.includes(event) || events.includes("*");
    });

    if (matchingEndpoints.length === 0) return;

    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      data,
    };

    const body = JSON.stringify(payload);

    // Fire all webhooks concurrently
    await Promise.allSettled(
      matchingEndpoints.map(async (endpoint) => {
        try {
          const signature = createHmac("sha256", endpoint.secret)
            .update(body)
            .digest("hex");

          const response = await fetch(endpoint.url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-VitrOS-Signature": signature,
              "X-VitrOS-Event": event,
            },
            body,
            signal: AbortSignal.timeout(10000), // 10s timeout
          });

          if (response.ok) {
            await prisma.webhookEndpoint.update({
              where: { id: endpoint.id },
              data: { lastDeliveredAt: new Date(), failureCount: 0 },
            });
          } else {
            await prisma.webhookEndpoint.update({
              where: { id: endpoint.id },
              data: { failureCount: { increment: 1 } },
            });
          }
        } catch {
          await prisma.webhookEndpoint.update({
            where: { id: endpoint.id },
            data: { failureCount: { increment: 1 } },
          });
        }
      })
    );
  } catch (error) {
    console.error("Webhook dispatch error:", error);
  }
}
