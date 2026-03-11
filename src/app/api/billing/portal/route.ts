import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRole, handleApiError, ApiError } from "@/lib/api-helpers";
import { stripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    requireRole(user, "admin", "manager");

    const org = await prisma.organization.findUnique({
      where: { id: user.organizationId },
      select: { stripeCustomerId: true },
    });

    if (!org?.stripeCustomerId) {
      throw new ApiError(
        "No billing account found. Subscribe to a plan first.",
        400
      );
    }

    const origin =
      req.headers.get("origin") ||
      process.env.AUTH_URL ||
      "https://vitroslabs.com";

    const session = await stripe.billingPortal.sessions.create({
      customer: org.stripeCustomerId,
      return_url: `${origin}/admin/billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    return handleApiError(error);
  }
}
