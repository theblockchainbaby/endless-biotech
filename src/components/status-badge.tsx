import { Badge } from "@/components/ui/badge";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  media_filled: { label: "Media Filled", variant: "outline" },
  planted: { label: "Planted", variant: "default" },
  growing: { label: "Growing", variant: "secondary" },
  ready_to_multiply: { label: "Ready", variant: "default" },
  multiplied: { label: "Multiplied", variant: "secondary" },
  disposed: { label: "Disposed", variant: "destructive" },
};

const healthConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  healthy: { label: "Healthy", variant: "default" },
  contaminated: { label: "Contaminated", variant: "destructive" },
  slow_growth: { label: "Slow Growth", variant: "secondary" },
  dead: { label: "Dead", variant: "destructive" },
};

export function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || { label: status, variant: "outline" as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export function HealthBadge({ status }: { status: string }) {
  const config = healthConfig[status] || { label: status, variant: "outline" as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
