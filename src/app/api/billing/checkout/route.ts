import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, handleApiError, ApiError } from "@/lib/api-helpers";
import { stripe, PLAN_CONFIG, PlanName } from "@/lib/stripe";
import { z } from "zod";

const checkoutSchema = z.object({
  plan: z.enum(["solo", "growth", "pro", "enterprise"]),
  coupon: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const { plan, coupon } = checkoutSchema.parse(body);

    const org = await prisma.organization.findUnique({
      where: { id: user.organizationId },
    });
    if (!org) throw new ApiError("Organization not found", 404);

    const planConfig = PLAN_CONFIG[plan as PlanName];
    if (!planConfig?.priceId) {
      throw new ApiError("Stripe price not configured for this plan. Contact support.", 400);
    }

    let customerId = org.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: org.name,
        metadata: {
          organizationId: org.id,
          organizationSlug: org.slug,
        },
      });
      customerId = customer.id;
      await prisma.organization.update({
        where: { id: org.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const origin =
      req.headers.get("origin") ||
      process.env.AUTH_URL ||
      "https://vitroslabs.com";

    const sessionParams: Record<string, unknown> = {
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: planConfig.priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days:
          org.plan === "free" && !org.trialEndsAt ? 30 : undefined,
        metadata: { organizationId: org.id },
      },
      success_url: `${origin}/admin/billing?success=true`,
      cancel_url: `${origin}/admin/billing?canceled=true`,
      metadata: { organizationId: org.id },
    };

    // Apply coupon (e.g. Founding Partner discount)
    if (coupon) {
      sessionParams.discounts = [{ coupon }];
      // Can't combine discounts with trial_period_days
      (sessionParams.subscription_data as Record<string, unknown>).trial_period_days = undefined;
    }

    const session = await stripe.checkout.sessions.create(
      sessionParams as Parameters<typeof stripe.checkout.sessions.create>[0]
    );

    return NextResponse.json({ url: session.url });
  } catch (error) {
    return handleApiError(error);
  }
}
