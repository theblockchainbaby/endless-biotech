export const VESSEL_STATUSES = [
  "media_filled",
  "planted",
  "growing",
  "ready_to_multiply",
  "multiplied",
  "disposed",
] as const;

export const VESSEL_STATUS_LABELS: Record<string, string> = {
  media_filled: "Media Filled",
  planted: "Planted",
  growing: "Growing",
  ready_to_multiply: "Ready to Multiply",
  multiplied: "Multiplied",
  disposed: "Disposed",
};

export const HEALTH_STATUSES = [
  "healthy",
  "contaminated",
  "slow_growth",
  "necrotic",
  "dead",
] as const;

export const HEALTH_STATUS_LABELS: Record<string, string> = {
  healthy: "Healthy",
  contaminated: "Contaminated",
  slow_growth: "Slow Growth",
  necrotic: "Necrotic",
  dead: "Dead",
};

export const STAGES = [
  "initiation",
  "multiplication",
  "rooting",
  "acclimation",
  "hardening",
] as const;

export const STAGE_LABELS: Record<string, string> = {
  initiation: "Initiation",
  multiplication: "Multiplication",
  rooting: "Rooting",
  acclimation: "Acclimation",
  hardening: "Hardening",
};

export const STAGE_ORDER: Record<string, number> = {
  initiation: 0,
  multiplication: 1,
  rooting: 2,
  acclimation: 3,
  hardening: 4,
};

export const USER_ROLES = [
  "tech",
  "media_maker",
  "lead_tech",
  "manager",
  "admin",
] as const;

export const USER_ROLE_LABELS: Record<string, string> = {
  tech: "Technician",
  media_maker: "Media Maker",
  lead_tech: "Lead Technician",
  manager: "Manager",
  admin: "Administrator",
};

export const LOCATION_TYPES = [
  "growth_chamber",
  "flow_hood",
  "bench",
  "greenhouse",
  "shelf",
  "cold_storage",
] as const;

export const LOCATION_TYPE_LABELS: Record<string, string> = {
  growth_chamber: "Growth Chamber",
  flow_hood: "Flow Hood",
  bench: "Bench",
  greenhouse: "Greenhouse",
  shelf: "Shelf",
  cold_storage: "Cold Storage",
};

export const CONTAMINATION_TYPES = [
  "bacterial",
  "fungal",
  "viral",
  "unknown",
] as const;

export const ACTIVITY_TYPES = [
  "created",
  "media_filled",
  "planted",
  "moved_to_growth",
  "stage_advanced",
  "multiplied",
  "health_update",
  "contaminated",
  "disposed",
  "location_changed",
  "photo_added",
  "updated",
] as const;

export const ACTIVITY_CATEGORIES = [
  "vessel",
  "media",
  "inventory",
  "location",
  "system",
] as const;

export const BASE_MEDIA_TYPES = [
  "MS",
  "DKW",
  "WPM",
  "B5",
  "LS",
  "SH",
  "N6",
] as const;

export const PGR_CATEGORIES = [
  "pgr_cytokinin",
  "pgr_auxin",
  "pgr_gibberellin",
  "vitamin",
  "mineral",
  "amino_acid",
  "other",
] as const;

export const ALERT_TYPES = [
  "subculture_due",
  "low_inventory",
  "environment_out_of_range",
  "contamination_spike",
] as const;

export const ALERT_SEVERITIES = ["info", "warning", "critical"] as const;

export const INVENTORY_CATEGORIES = [
  "chemical",
  "consumable",
  "container",
  "equipment",
] as const;

export const DEFAULT_SUBCULTURE_INTERVAL_DAYS = 14;

export const PROTOCOL_STAGES = [
  "initiation",
  "multiplication",
  "rooting",
  "acclimation",
  "hardening",
  "media_prep",
] as const;

export const PROTOCOL_STAGE_LABELS: Record<string, string> = {
  initiation: "Initiation",
  multiplication: "Multiplication",
  rooting: "Rooting",
  acclimation: "Acclimation",
  hardening: "Hardening",
  media_prep: "Media Prep",
};

export const CULTIVAR_HEALTH_LABELS: Record<string, string> = {
  healthy: "Healthy",
  stable: "Stable",
  critical: "Critical",
};
