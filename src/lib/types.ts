export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: string;
  settings: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  image: string | null;
  isActive: boolean;
  organizationId: string;
  createdAt: string;
}

export interface Cultivar {
  id: string;
  name: string;
  species: string;
  strain: string | null;
  geneticLineage: string | null;
  description: string | null;
  targetMultiplicationRate: number | null;
  defaultMediaRecipeId: string | null;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
  // Relations
  defaultMediaRecipe?: MediaRecipe | null;
  vessels?: Vessel[];
  _count?: { vessels: number };
}

export interface Vessel {
  id: string;
  barcode: string;
  cultivarId: string | null;
  mediaRecipeId: string | null;
  locationId: string | null;
  explantCount: number;
  healthStatus: string;
  status: string;
  stage: string;
  subcultureNumber: number;
  generation: number;
  contaminationType: string | null;
  contaminationDate: string | null;
  disposalReason: string | null;
  notes: string | null;
  parentVesselId: string | null;
  organizationId: string;
  plantedAt: string | null;
  nextSubcultureDate: string | null;
  createdAt: string;
  updatedAt: string;
  // Relations
  cultivar?: Cultivar | null;
  mediaRecipe?: MediaRecipe | null;
  location?: Location | null;
  parentVessel?: { id: string; barcode: string } | null;
  childVessels?: { id: string; barcode: string; status: string }[];
  activities?: Activity[];
  photos?: Photo[];
}

export interface MediaRecipe {
  id: string;
  name: string;
  baseMedia: string;
  targetPH: number | null;
  agarConcentration: number | null;
  sucroseConcentration: number | null;
  stage: string | null;
  notes: string | null;
  isActive: boolean;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
  // Relations
  components?: MediaComponent[];
  batches?: MediaBatch[];
}

export interface MediaComponent {
  id: string;
  recipeId: string;
  name: string;
  category: string;
  concentration: number;
  unit: string;
}

export interface MediaBatch {
  id: string;
  batchNumber: string;
  recipeId: string;
  volumeL: number;
  vesselCount: number;
  preparedById: string | null;
  measuredPH: number | null;
  autoclaved: boolean;
  autoclavedAt: string | null;
  expiresAt: string | null;
  notes: string | null;
  createdAt: string;
  // Relations
  recipe?: MediaRecipe;
  preparedBy?: { id: string; name: string } | null;
}

export interface Location {
  id: string;
  name: string;
  type: string;
  siteId: string;
  parentId: string | null;
  capacity: number | null;
  conditions: Record<string, number> | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Relations
  site?: Site;
  parent?: Location | null;
  children?: Location[];
  vessels?: Vessel[];
  _count?: { vessels: number };
}

export interface Site {
  id: string;
  name: string;
  address: string | null;
  organizationId: string;
  createdAt: string;
  // Relations
  locations?: Location[];
}

export interface Activity {
  id: string;
  vesselId: string | null;
  userId: string | null;
  type: string;
  category: string;
  previousState: Record<string, unknown> | null;
  newState: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  notes: string | null;
  createdAt: string;
  // Relations
  vessel?: { id: string; barcode: string } | null;
  user?: { id: string; name: string } | null;
}

export interface Photo {
  id: string;
  url: string;
  thumbnailUrl: string | null;
  vesselId: string | null;
  cultivarId: string | null;
  caption: string | null;
  stage: string | null;
  takenById: string | null;
  createdAt: string;
}

export interface EnvironmentReading {
  id: string;
  locationId: string;
  temperature: number | null;
  humidity: number | null;
  co2Level: number | null;
  lightLevel: number | null;
  recordedAt: string;
  source: string;
  // Relations
  location?: Location;
  recordedBy?: { id: string; name: string } | null;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  sku: string | null;
  supplier: string | null;
  currentStock: number;
  unit: string;
  reorderLevel: number | null;
  costPerUnit: number | null;
  storageLocation: string | null;
  expirationDate: string | null;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Alert {
  id: string;
  type: string;
  severity: string;
  title: string;
  message: string;
  entityType: string | null;
  entityId: string | null;
  isRead: boolean;
  isDismissed: boolean;
  organizationId: string;
  userId: string | null;
  createdAt: string;
}

// Dashboard stat types
export interface DashboardStats {
  totalVessels: number;
  activeVessels: number;
  totalExplants: number;
  contaminationRate: number;
  multiplicationRate: number;
  vesselsByStatus: { status: string; count: number }[];
  vesselsByStage: { stage: string; count: number }[];
  vesselsByCultivar: {
    cultivarId: string;
    cultivarName: string;
    vesselCount: number;
    explantCount: number;
  }[];
  recentActivities: Activity[];
  healthBreakdown: { status: string; count: number }[];
  readyToMultiply: {
    id: string;
    barcode: string;
    cultivarName: string;
    explantCount: number;
    updatedAt: string;
  }[];
  subcultureDue: {
    overdue: number;
    today: number;
    thisWeek: number;
  };
}
