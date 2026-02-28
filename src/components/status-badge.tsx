import { Badge } from "@/components/ui/badge";
import { VESSEL_STATUS_LABELS, HEALTH_STATUS_LABELS, STAGE_LABELS } from "@/lib/constants";

const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  media_filled: "outline",
  planted: "default",
  growing: "secondary",
  ready_to_multiply: "default",
  multiplied: "secondary",
  disposed: "destructive",
};

const healthVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  healthy: "default",
  contaminated: "destructive",
  slow_growth: "secondary",
  necrotic: "destructive",
  dead: "destructive",
};

const stageColors: Record<string, string> = {
  initiation: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  multiplication: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  rooting: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  acclimation: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  hardening: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
};

export function StatusBadge({ status }: { status: string }) {
  const variant = statusVariants[status] || "outline";
  const label = VESSEL_STATUS_LABELS[status] || status;
  return <Badge variant={variant}>{label}</Badge>;
}

export function HealthBadge({ status }: { status: string }) {
  const variant = healthVariants[status] || "outline";
  const label = HEALTH_STATUS_LABELS[status] || status;
  return <Badge variant={variant}>{label}</Badge>;
}

export function StageBadge({ stage }: { stage: string }) {
  const label = STAGE_LABELS[stage] || stage;
  const colorClass = stageColors[stage] || "bg-muted text-muted-foreground";
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${colorClass}`}>
      {label}
    </span>
  );
}
