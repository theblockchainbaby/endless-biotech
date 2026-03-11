import { NextRequest, NextResponse } from "next/server";
import { stripe, planFromPriceId } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import Stripe from "stripe";

export const dynamic = "force-dynamic";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SubData = Stripe.Subscription & Record<string, any>;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("[Stripe Webhook] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const organizationId = session.metadata?.organizationId;
        if (!organizationId || !session.subscription) break;

        const sub = (await stripe.subscriptions.retrieve(
          session.subscription as string
        )) as SubData;
        const priceId = sub.items.data[0]?.price.id;
        const plan = planFromPriceId(priceId);

        await prisma.organization.update({
          where: { id: organizationId },
          data: {
            stripeSubscriptionId: sub.id,
            stripePriceId: priceId,
            plan,
            planStatus: sub.status === "trialing" ? "trialing" : "active",
            trialEndsAt: sub.trial_end
              ? new Date(sub.trial_end * 1000)
              : null,
            currentPeriodEnd: sub.current_period_end
              ? new Date(sub.current_period_end * 1000)
              : null,
          },
        });
        break;
      }

      case "customer.subscription.updated": {
        const updatedSub = event.data.object as SubData;
        const orgId = updatedSub.metadata?.organizationId;
        if (!orgId) break;

        const updatedPriceId = updatedSub.items.data[0]?.price.id;
        const updatedPlan = planFromPriceId(updatedPriceId);

        await prisma.organization.update({
          where: { id: orgId },
          data: {
            stripePriceId: updatedPriceId,
            plan: updatedPlan,
            planStatus: updatedSub.status as string,
            trialEndsAt: updatedSub.trial_end
              ? new Date(updatedSub.trial_end * 1000)
              : null,
            currentPeriodEnd: updatedSub.current_period_end
              ? new Date(updatedSub.current_period_end * 1000)
              : null,
          },
        });
        break;
      }

      case "customer.subscription.deleted": {
        const deletedSub = event.data.object as Stripe.Subscription;
        const organizationId = deletedSub.metadata?.organizationId;
        if (!organizationId) break;

        await prisma.organization.update({
          where: { id: organizationId },
          data: {
            plan: "free",
            planStatus: "canceled",
            stripeSubscriptionId: null,
            stripePriceId: null,
          },
        });
        break;
      }

      case "invoice.payment_failed": {
        const failedInvoice = event.data.object as Stripe.Invoice;
        const failedSubId =
          failedInvoice.parent?.subscription_details?.subscription;
        if (!failedSubId) break;

        const failedSub = (await stripe.subscriptions.retrieve(
          typeof failedSubId === "string" ? failedSubId : failedSubId.id
        )) as SubData;
        const failedOrgId = failedSub.metadata?.organizationId;
        if (!failedOrgId) break;

        await prisma.organization.update({
          where: { id: failedOrgId },
          data: { planStatus: "past_due" },
        });

        const admins = await prisma.user.findMany({
          where: {
            organizationId: failedOrgId,
            role: { in: ["admin", "manager"] },
          },
          select: { email: true },
        });

        if (admins.length > 0) {
          const origin = process.env.AUTH_URL || "https://vitroslabs.com";
          await sendEmail({
            to: admins.map((a) => a.email),
            subject: "[VitrOS] Payment Failed — Action Required",
            html: `
              <div style="font-family: system-ui, sans-serif; max-width: 500px;">
                <div style="background: #dc2626; color: white; padding: 12px 16px; border-radius: 8px 8px 0 0;">
                  <h2 style="margin: 0; font-size: 16px;">Payment Failed</h2>
                </div>
                <div style="border: 1px solid #e5e7eb; border-top: none; padding: 16px; border-radius: 0 0 8px 8px;">
                  <p>Your latest payment for VitrOS was unsuccessful. Please update your payment method to avoid service interruption.</p>
                  <a href="${origin}/admin/billing" style="display: inline-block; background: #2563eb; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; margin-top: 12px;">Update Payment Method</a>
                </div>
              </div>
            `,
          });
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const paidInvoice = event.data.object as Stripe.Invoice;
        const paidSubId =
          paidInvoice.parent?.subscription_details?.subscription;
        if (!paidSubId) break;

        const paidSub = (await stripe.subscriptions.retrieve(
          typeof paidSubId === "string" ? paidSubId : paidSubId.id
        )) as SubData;
        const paidOrgId = paidSub.metadata?.organizationId;
        if (!paidOrgId) break;

        await prisma.organization.update({
          where: { id: paidOrgId },
          data: {
            planStatus: "active",
            currentPeriodEnd: paidSub.current_period_end
              ? new Date(paidSub.current_period_end * 1000)
              : null,
          },
        });
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Stripe Webhook] Processing error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
