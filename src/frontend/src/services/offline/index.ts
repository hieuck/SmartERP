/**
 * Offline Services Index
 * Exports all offline services for easy import
 */

// Base service
export { BaseOfflineService } from './base-offline.service';

// Accounting services (4)
export {
  AccountOfflineService,
  JournalEntryOfflineService,
  LedgerOfflineService,
  TaxRateOfflineService,
  accountOfflineService,
  journalEntryOfflineService,
  ledgerOfflineService,
  taxRateOfflineService,
} from './accounting-offline.service';

// Purchasing services (2)
export {
  PurchaseReceiptOfflineService,
  SupplierInvoiceOfflineService,
  purchaseReceiptOfflineService,
  supplierInvoiceOfflineService,
} from './purchasing-offline.service';

// Sales services (2)
export {
  QuotationOfflineService,
  DeliveryNoteOfflineService,
  quotationOfflineService,
  deliveryNoteOfflineService,
} from './sales-offline.service';

// Inventory services (3)
export {
  StockAdjustmentOfflineService,
  StockTransferOfflineService,
  BinLocationOfflineService,
  stockAdjustmentOfflineService,
  stockTransferOfflineService,
  binLocationOfflineService,
} from './inventory-offline.service';

// Manufacturing services (3)
export {
  BOMOfflineService,
  WorkOrderOfflineService,
  ProductionPlanOfflineService,
  bomOfflineService,
  workOrderOfflineService,
  productionPlanOfflineService,
} from './manufacturing-offline.service';

// HR services (4)
export {
  EmployeeOfflineService,
  DepartmentOfflineService,
  PositionOfflineService,
  ShiftOfflineService,
  employeeOfflineService,
  departmentOfflineService,
  positionOfflineService,
  shiftOfflineService,
} from './hr-offline.service';

// Project services (3)
export {
  ProjectOfflineService,
  TaskOfflineService,
  TimeEntryOfflineService,
  projectOfflineService,
  taskOfflineService,
  timeEntryOfflineService,
} from './project-offline.service';

// Platform services (4)
export {
  DocumentOfflineService,
  ReportOfflineService,
  WorkflowOfflineService,
  SettingsOfflineService,
  documentOfflineService,
  reportOfflineService,
  workflowOfflineService,
  settingsOfflineService,
} from './platform-offline.service';
