"use client";

import { Badge } from "@/components/ui/badge";

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  starter: "Starter",
  pro: "Pro",
  enterprise: "Enterprise",
};

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  trialing: "secondary",
  past_due: "destructive",
  canceled: "outline",
};

export function PlanBadge({
  plan,
  status,
}: {
  plan: string;
  status?: string;
}) {
  const label = PLAN_LABELS[plan] || plan;
  const variant = status ? STATUS_VARIANTS[status] || "default" : "default";

  return (
    <Badge variant={variant}>
      {label}
      {status === "trialing" && " (Trial)"}
      {status === "past_due" && " — Past Due"}
      {status === "canceled" && " — Canceled"}
    </Badge>
  );
}
