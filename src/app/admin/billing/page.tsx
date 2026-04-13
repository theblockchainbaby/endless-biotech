"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Check,
  CreditCard,
  AlertTriangle,
  Zap,
  Users,
  FlaskConical,
  Loader2,
} from "lucide-react";

const PLANS = [
  {
    key: "solo",
    name: "Solo",
    price: 99,
    maxVessels: "500",
    maxMembers: "1",
    features: [
      "Up to 500 active vessels",
      "1 user",
      "Barcode scanning",
      "Batch operations",
      "Cultivar tracking",
      "Email support",
    ],
  },
  {
    key: "growth",
    name: "Growth",
    price: 299,
    maxVessels: "Unlimited",
    maxMembers: "5",
    popular: true,
    features: [
      "Unlimited vessels",
      "Up to 5 users",
      "Full analytics & forecasting",
      "Contamination tracking",
      "Clone line management",
      "CSV import",
      "Priority email support",
    ],
  },
  {
    key: "pro",
    name: "Pro",
    price: 799,
    maxVessels: "Unlimited",
    maxMembers: "15",
    features: [
      "Unlimited vessels",
      "Up to 15 users",
      "AI Lab Assistant",
      "Team performance tracking",
      "Production forecasting",
      "Priority support",
      "Custom integrations",
    ],
  },
  {
    key: "enterprise",
    name: "Enterprise",
    price: 2499,
    maxVessels: "Unlimited",
    maxMembers: "Unlimited",
    features: [
      "Unlimited users and vessels",
      "Dedicated account manager",
      "Custom onboarding",
      "SLA guarantee",
      "API access",
      "On-site training",
    ],
  },
];

interface BillingStatus {
  plan: string;
  planName: string;
  planStatus: string;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  hasSubscription: boolean;
  price: number;
  limits: {
    maxVessels: number;
    maxTeamMembers: number;
    currentVessels: number;
    currentTeamMembers: number;
  };
}

const STATUS_STYLES: Record<
  string,
  { variant: "default" | "secondary" | "destructive" | "outline"; label: string }
> = {
  active: { variant: "default", label: "Active" },
  trialing: { variant: "secondary", label: "Trial" },
  past_due: { variant: "destructive", label: "Past Due" },
  canceled: { variant: "outline", label: "Canceled" },
};

function UsageBar({
  label,
  icon: Icon,
  current,
  max,
}: {
  label: string;
  icon: React.ElementType;
  current: number;
  max: number;
}) {
  const unlimited = max === -1;
  const pct = unlimited ? 0 : Math.min((current / max) * 100, 100);
  const isHigh = !unlimited && pct >= 80;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span>{label}</span>
        </div>
        <span className={isHigh ? "text-amber-600 font-medium" : "text-muted-foreground"}>
          {current.toLocaleString()} / {unlimited ? "Unlimited" : max.toLocaleString()}
        </span>
      </div>
      {!unlimited && (
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              isHigh ? "bg-amber-500" : "bg-primary"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense>
      <BillingContent />
    </Suspense>
  );
}

function BillingContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get("success")) toast.success("Subscription activated!");
    if (searchParams.get("canceled")) toast.info("Checkout canceled.");
    fetchStatus();
  }, [searchParams]);

  const fetchStatus = () => {
    fetch("/api/billing/status")
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => toast.error("Failed to load billing info"))
      .finally(() => setLoading(false));
  };

  const handleCheckout = async (plan: string) => {
    setCheckoutLoading(plan);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error || "Failed to create checkout session");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handlePortal = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error || "Failed to open billing portal");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setPortalLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!status) return null;

  const statusStyle = STATUS_STYLES[status.planStatus] || STATUS_STYLES.active;
  const trialDaysLeft = status.trialEndsAt
    ? Math.max(
        0,
        Math.ceil(
          (new Date(status.trialEndsAt).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24)
        )
      )
    : null;

  return (
    <div className="space-y-6 p-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Billing</h1>
        <p className="text-muted-foreground">
          Manage your subscription and usage.
        </p>
      </div>

      {/* Past due warning */}
      {status.planStatus === "past_due" && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3 text-red-700 dark:text-red-400">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <div>
              <p className="font-medium">Payment failed</p>
              <p className="text-sm opacity-80">
                Update your payment method to avoid service interruption.
              </p>
            </div>
          </div>
          <Button variant="destructive" size="sm" onClick={handlePortal}>
            Fix Payment
          </Button>
        </div>
      )}

      {/* Current plan */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Current Plan</CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl font-bold">{status.planName}</span>
              <Badge variant={statusStyle.variant}>{statusStyle.label}</Badge>
            </div>
            {status.price > 0 && (
              <p className="text-muted-foreground text-sm mt-1">
                ${status.price.toLocaleString()}/mo
              </p>
            )}
            {trialDaysLeft !== null && trialDaysLeft > 0 && (
              <p className="text-sm text-amber-600 mt-1">
                {trialDaysLeft} day{trialDaysLeft !== 1 ? "s" : ""} left in
                trial
              </p>
            )}
            {status.currentPeriodEnd && status.planStatus === "active" && (
              <p className="text-sm text-muted-foreground mt-1">
                Renews{" "}
                {new Date(status.currentPeriodEnd).toLocaleDateString()}
              </p>
            )}
          </div>
          {status.hasSubscription && (
            <Button
              variant="outline"
              onClick={handlePortal}
              disabled={portalLoading}
            >
              {portalLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CreditCard className="h-4 w-4 mr-2" />
              )}
              Manage Billing
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <UsageBar
            label="Active Vessels"
            icon={FlaskConical}
            current={status.limits.currentVessels}
            max={status.limits.maxVessels}
          />
          <UsageBar
            label="Team Members"
            icon={Users}
            current={status.limits.currentTeamMembers}
            max={status.limits.maxTeamMembers}
          />
        </CardContent>
      </Card>

      {/* Plan cards */}
      <div>
        <h2 className="text-lg font-semibold mb-4">
          {status.hasSubscription ? "Change Plan" : "Choose a Plan"}
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          {PLANS.map((plan) => {
            const isCurrent = status.plan === plan.key;
            return (
              <Card
                key={plan.key}
                className={`relative ${
                  plan.popular ? "border-primary shadow-md" : ""
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">
                      Most Popular
                    </Badge>
                  </div>
                )}
                <CardContent className="pt-6">
                  <h3 className="font-bold text-lg">{plan.name}</h3>
                  <div className="mt-2 mb-4">
                    <span className="text-3xl font-bold">
                      ${plan.price.toLocaleString()}
                    </span>
                    <span className="text-muted-foreground">/mo</span>
                  </div>
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((f) => (
                      <li
                        key={f}
                        className="flex items-start gap-2 text-sm"
                      >
                        <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  {isCurrent ? (
                    <Button className="w-full" variant="outline" disabled>
                      Current Plan
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      variant={plan.popular ? "default" : "outline"}
                      onClick={() => handleCheckout(plan.key)}
                      disabled={!!checkoutLoading}
                    >
                      {checkoutLoading === plan.key ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Zap className="h-4 w-4 mr-2" />
                      )}
                      {status.hasSubscription ? "Switch" : "Subscribe"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
