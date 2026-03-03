import { z } from "zod";
import {
  VESSEL_STATUSES,
  HEALTH_STATUSES,
  STAGES,
  USER_ROLES,
  LOCATION_TYPES,
  CONTAMINATION_TYPES,
  BASE_MEDIA_TYPES,
  PGR_CATEGORIES,
  INVENTORY_CATEGORIES,
} from "./constants";

// ==================== VESSEL ====================

export const createVesselSchema = z.object({
  barcode: z.string().min(1, "Barcode is required"),
  cultivarId: z.string().nullable().optional(),
  mediaRecipeId: z.string().nullable().optional(),
  locationId: z.string().nullable().optional(),
  explantCount: z.number().int().min(0).default(0),
  healthStatus: z.enum(HEALTH_STATUSES).default("healthy"),
  status: z.enum(VESSEL_STATUSES).default("media_filled"),
  stage: z.enum(STAGES).default("initiation"),
  notes: z.string().nullable().optional(),
});

export const updateVesselSchema = z.object({
  cultivarId: z.string().nullable().optional(),
  mediaRecipeId: z.string().nullable().optional(),
  locationId: z.string().nullable().optional(),
  explantCount: z.number().int().min(0).optional(),
  healthStatus: z.enum(HEALTH_STATUSES).optional(),
  status: z.enum(VESSEL_STATUSES).optional(),
  stage: z.enum(STAGES).optional(),
  contaminationType: z.enum(CONTAMINATION_TYPES).nullable().optional(),
  contaminationDate: z.string().datetime().nullable().optional(),
  disposalReason: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const multiplyVesselSchema = z.object({
  children: z.array(
    z.object({
      barcode: z.string().min(1, "Barcode is required"),
      explantCount: z.number().int().min(0).default(0),
      mediaRecipeId: z.string().nullable().optional(),
      notes: z.string().nullable().optional(),
    })
  ).min(1, "At least one child vessel is required"),
});

export const advanceStageSchema = z.object({
  notes: z.string().optional(),
});

export const healthCheckSchema = z.object({
  healthStatus: z.enum(HEALTH_STATUSES),
  contaminationType: z.enum(CONTAMINATION_TYPES).nullable().optional(),
  notes: z.string().optional(),
});

export const moveVesselSchema = z.object({
  locationId: z.string().min(1, "Location is required"),
  notes: z.string().optional(),
});

export const batchOperationSchema = z.object({
  vesselIds: z.array(z.string()).min(1),
  action: z.enum(["advance_stage", "move", "health_check", "dispose", "assign_media"]),
  params: z.record(z.string(), z.unknown()).optional(),
});

// ==================== CULTIVAR ====================

export const createCultivarSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().nullable().optional(),
  cultivarType: z.enum(["in_house", "client"]).default("in_house"),
  species: z.string().default("Cannabis"),
  strain: z.string().nullable().optional(),
  geneticLineage: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  targetMultiplicationRate: z.number().positive().nullable().optional(),
  defaultMediaRecipeId: z.string().nullable().optional(),
});

export const updateCultivarSchema = createCultivarSchema.partial();

// ==================== MEDIA ====================

export const mediaComponentSchema = z.object({
  name: z.string().min(1),
  category: z.enum(PGR_CATEGORIES),
  concentration: z.number().positive(),
  unit: z.string().default("mg/L"),
});

export const createMediaRecipeSchema = z.object({
  name: z.string().min(1, "Recipe name is required"),
  baseMedia: z.enum(BASE_MEDIA_TYPES),
  targetPH: z.number().min(0).max(14).nullable().optional(),
  agarConcentration: z.number().min(0).nullable().optional(),
  sucroseConcentration: z.number().min(0).nullable().optional(),
  stage: z.enum(STAGES).nullable().optional(),
  notes: z.string().nullable().optional(),
  components: z.array(mediaComponentSchema).optional(),
});

export const updateMediaRecipeSchema = createMediaRecipeSchema.partial();

export const createMediaBatchSchema = z.object({
  recipeId: z.string().min(1),
  batchNumber: z.string().min(1),
  volumeL: z.number().positive(),
  vesselCount: z.number().int().positive(),
  measuredPH: z.number().min(0).max(14).nullable().optional(),
  autoclaved: z.boolean().default(false),
  autoclavedAt: z.string().datetime().nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  notes: z.string().nullable().optional(),
});

// ==================== LOCATION ====================

export const createLocationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(LOCATION_TYPES),
  siteId: z.string().min(1),
  parentId: z.string().nullable().optional(),
  capacity: z.number().int().positive().nullable().optional(),
  conditions: z
    .object({
      temperature: z.number().optional(),
      humidity: z.number().min(0).max(100).optional(),
      lightHours: z.number().min(0).max(24).optional(),
      lightIntensity: z.number().min(0).optional(),
    })
    .nullable()
    .optional(),
});

export const updateLocationSchema = createLocationSchema.partial();

// ==================== USER ====================

export const createUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(USER_ROLES).default("tech"),
  pin: z
    .string()
    .regex(/^\d{4}$/, "PIN must be 4 digits")
    .nullable()
    .optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.enum(USER_ROLES).optional(),
  pin: z
    .string()
    .regex(/^\d{4}$/, "PIN must be 4 digits")
    .nullable()
    .optional(),
  isActive: z.boolean().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const pinLoginSchema = z.object({
  pin: z.string().regex(/^\d{4}$/),
});

// ==================== ENVIRONMENT ====================

export const createEnvironmentReadingSchema = z.object({
  locationId: z.string().min(1),
  temperature: z.number().nullable().optional(),
  humidity: z.number().min(0).max(100).nullable().optional(),
  co2Level: z.number().min(0).nullable().optional(),
  lightLevel: z.number().min(0).nullable().optional(),
});

// ==================== INVENTORY ====================

export const createInventoryItemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.enum(INVENTORY_CATEGORIES),
  sku: z.string().nullable().optional(),
  supplier: z.string().nullable().optional(),
  currentStock: z.number().min(0).default(0),
  unit: z.string().min(1),
  reorderLevel: z.number().min(0).nullable().optional(),
  costPerUnit: z.number().min(0).nullable().optional(),
  storageLocation: z.string().nullable().optional(),
  expirationDate: z.string().datetime().nullable().optional(),
});

export const updateInventoryItemSchema = createInventoryItemSchema.partial();

export const recordInventoryUsageSchema = z.object({
  quantity: z.number(), // negative = consumption, positive = restock
  reason: z.string().nullable().optional(),
});
