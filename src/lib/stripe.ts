import Stripe from "stripe";

function getStripeClient() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  return new Stripe(key, { typescript: true });
}

// Lazy singleton — only instantiated when first accessed
let _stripe: Stripe | null = null;
export function getStripe(): Stripe {
  if (!_stripe) _stripe = getStripeClient();
  return _stripe;
}

// For backward compatibility — access via getter
export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (getStripe() as any)[prop];
  },
});

export const PLAN_CONFIG = {
  free: {
    name: "Free",
    priceId: null as string | null,
    maxVessels: 50,
    maxTeamMembers: 2,
    price: 0,
  },
  starter: {
    name: "Starter",
    priceId: process.env.STRIPE_STARTER_PRICE_ID || null,
    maxVessels: 2000,
    maxTeamMembers: 5,
    price: 499,
  },
  pro: {
    name: "Pro",
    priceId: process.env.STRIPE_PRO_PRICE_ID || null,
    maxVessels: 10000,
    maxTeamMembers: 15,
    price: 1299,
  },
  enterprise: {
    name: "Enterprise",
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID || null,
    maxVessels: Infinity,
    maxTeamMembers: Infinity,
    price: 2499,
  },
} as const;

export type PlanName = keyof typeof PLAN_CONFIG;

export function planFromPriceId(priceId: string): PlanName {
  for (const [plan, config] of Object.entries(PLAN_CONFIG)) {
    if (config.priceId === priceId) return plan as PlanName;
  }
  return "free";
}
