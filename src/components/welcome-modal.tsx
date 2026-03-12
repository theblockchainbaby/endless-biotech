"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  FlaskConical, ScanBarcode, BarChart3, CalendarClock,
  Leaf, TrendingUp, Package, ArrowRight,
} from "lucide-react";

const WELCOME_KEY = "vitros_welcome_dismissed";

const steps = [
  {
    icon: ScanBarcode,
    title: "Scan & Track Vessels",
    description: "Scan barcodes to create or update vessels instantly. Track every jar from initiation through hardening.",
    href: "/scan",
    color: "text-blue-500",
  },
  {
    icon: FlaskConical,
    title: "Monitor Your Pipeline",
    description: "See all vessels by stage, health status, and cultivar. Spot contamination early.",
    href: "/vessels",
    color: "text-green-500",
  },
  {
    icon: CalendarClock,
    title: "Daily Task Planner",
    description: "Morning briefing: overdue subcultures, what's due today, low inventory alerts.",
    href: "/tasks",
    color: "text-amber-500",
  },
  {
    icon: TrendingUp,
    title: "Forecast & Plan",
    description: "Project vessel counts weeks ahead. Plan production schedules from sales orders.",
    href: "/forecasting",
    color: "text-purple-500",
  },
];

export function WelcomeModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(WELCOME_KEY)) {
        setOpen(true);
      }
    } catch { /* SSR or private browsing */ }
  }, []);

  const handleDismiss = () => {
    setOpen(false);
    try {
      localStorage.setItem(WELCOME_KEY, "1");
    } catch { /* ignore */ }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleDismiss(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">Welcome to VitrOS</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Tissue culture lab management — from vessel tracking to production planning.
            Here&apos;s how to get started:
          </p>
        </DialogHeader>
        <div className="space-y-3 py-2">
          {steps.map((step) => (
            <Link
              key={step.href}
              href={step.href}
              onClick={handleDismiss}
              className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted transition-colors group"
            >
              <step.icon className={`size-5 mt-0.5 ${step.color} shrink-0`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{step.title}</p>
                <p className="text-xs text-muted-foreground">{step.description}</p>
              </div>
              <ArrowRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-1 shrink-0" />
            </Link>
          ))}
        </div>
        <div className="flex justify-between items-center pt-2">
          <p className="text-xs text-muted-foreground">You can explore the sidebar to find all features.</p>
          <Button onClick={handleDismiss} size="sm">
            Get Started
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
