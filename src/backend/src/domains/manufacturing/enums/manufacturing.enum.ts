// Material enums
export enum MaterialType {
  RAW_MATERIAL = 'raw_material',
  COMPONENT = 'component',
  FINISHED_GOOD = 'finished_good',
  PACKAGING = 'packaging',
}

// Mold enums
export enum MoldStatus {
  AVAILABLE = 'available',
  IN_USE = 'in_use',
  MAINTENANCE = 'maintenance',
  RETIRED = 'retired',
}

export enum MoldCondition {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
}

// BOM enums
export enum BomStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  OBSOLETE = 'obsolete',
}

export enum BOMType {
  STANDARD = 'standard',
  PHANTOM = 'phantom',
  ENGINEERING = 'engineering',
}

// Work Order enums
export enum WorkOrderStatus {
  DRAFT = 'draft',
  PLANNED = 'planned',
  RELEASED = 'released',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum WorkOrderPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

// Quality Check enums
export enum QualityCheckType {
  INCOMING = 'incoming',
  IN_PROCESS = 'in_process',
  FINAL = 'final',
  RANDOM = 'random',
}

export enum QualityCheckResult {
  PASS = 'pass',
  FAIL = 'fail',
  CONDITIONAL = 'conditional',
  PENDING = 'pending',
}
