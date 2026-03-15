// Platform-specific enums
// Note: Shared enums (ApprovalStatus, JobStatus, JobPriority, ErrorSeverity, etc.)
// have been moved to @common/enums/shared.enum

// Workflow enums
export enum WorkflowStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ARCHIVED = 'archived',
}

// Use @/platform/workflow/enums/workflow-instance-status.enum instead

// System Admin enums
export enum SettingCategory {
  GENERAL = 'general',
  SECURITY = 'security',
  EMAIL = 'email',
  NOTIFICATION = 'notification',
  INTEGRATION = 'integration',
}

export enum SettingType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  JSON = 'json',
}

// Support enums
export enum TicketChannel {
  EMAIL = 'email',
  PHONE = 'phone',
  CHAT = 'chat',
  WEB = 'web',
}

export enum TicketSatisfactionRating {
  VERY_DISSATISFIED = 1,
  DISSATISFIED = 2,
  NEUTRAL = 3,
  SATISFIED = 4,
  VERY_SATISFIED = 5,
}

export enum AssignmentStrategy {
  ROUND_ROBIN = 'round_robin',
  LOAD_BALANCED = 'load_balanced',
  LEAST_ACTIVE = 'least_active',
  RANDOM = 'random',
  SKILL_BASED = 'skill_based',
  MANUAL = 'manual',
}

export enum ArticleStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

// Notification enums
export enum NotificationStatus {
  UNREAD = 'unread',
  READ = 'read',
  ARCHIVED = 'archived',
}

// Report enums
export enum ReportType {
  TABLE = 'table',
  CHART = 'chart',
  DASHBOARD = 'dashboard',
}

export enum ChartType {
  BAR = 'bar',
  LINE = 'line',
  PIE = 'pie',
  AREA = 'area',
  SCATTER = 'scatter',
}

export enum ColumnType {
  STRING = 'string',
  TEXT = 'text',
  NUMBER = 'number',
  CURRENCY = 'currency',
  DATE = 'date',
  BOOLEAN = 'boolean',
}

export enum AggregationType {
  SUM = 'sum',
  AVG = 'avg',
  COUNT = 'count',
  MIN = 'min',
  MAX = 'max',
  NONE = 'none',
}

// Document enums
export enum DocumentStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

// Audit enums - Use @/platform/audit/enums/audit-action.enum instead
