"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Zap, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BannerData {
  type: "trial_ending" | "past_due" | "vessel_limit" | null;
  message: string;
  daysLeft?: number;
  usagePct?: number;
}

export function UpgradeBanner() {
  const [banner, setBanner] = useState<BannerData | null>(null);

  useEffect(() => {
    fetch("/api/billing/status")
      .then((r) => r.json())
      .then((status) => {
        // Past due — highest priority
        if (status.planStatus === "past_due") {
          setBanner({
            type: "past_due",
            message: "Your payment failed. Update your payment method to avoid service interruption.",
          });
          return;
        }

        // Trial ending soon (< 3 days)
        if (status.trialEndsAt) {
          const daysLeft = Math.max(
            0,
            Math.ceil((new Date(status.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          );
          if (daysLeft <= 3 && daysLeft > 0) {
            setBanner({
              type: "trial_ending",
              message: `Your trial ends in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}. Upgrade to keep your data.`,
              daysLeft,
            });
            return;
          }
        }

        // Approaching vessel limit (> 80%)
        if (status.limits && status.limits.maxVessels > 0) {
          const pct = (status.limits.currentVessels / status.limits.maxVessels) * 100;
          if (pct >= 80) {
            setBanner({
              type: "vessel_limit",
              message: `You're using ${Math.round(pct)}% of your vessel limit. Upgrade for more capacity.`,
              usagePct: pct,
            });
            return;
          }
        }
      })
      .catch(() => {});
  }, []);

  if (!banner) return null;

  const icons = {
    past_due: AlertTriangle,
    trial_ending: Clock,
    vessel_limit: Zap,
  };
  const colors = {
    past_due: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400",
    trial_ending: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400",
    vessel_limit: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400",
  };

  const Icon = icons[banner.type!];
  const colorClass = colors[banner.type!];

  return (
    <div className={`border rounded-lg p-3 flex items-center justify-between gap-3 ${colorClass}`}>
      <div className="flex items-center gap-2 text-sm">
        <Icon className="h-4 w-4 shrink-0" />
        <span>{banner.message}</span>
      </div>
      <Link href="/admin/billing">
        <Button size="sm" variant={banner.type === "past_due" ? "destructive" : "default"}>
          {banner.type === "past_due" ? "Fix Payment" : "Upgrade"}
        </Button>
      </Link>
    </div>
  );
}
