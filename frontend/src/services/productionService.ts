/**
 * Production Service
 * Handles API calls for production module
 */

import api from './api';

// Worker interfaces
export interface Worker {
  id: string;
  code: string;
  fullName: string;
  phone?: string;
  address?: string;
  hireDate: Date;
  specialty: 'molding' | 'painting' | 'finishing' | 'packaging';
  skillLevel: 'apprentice' | 'skilled' | 'master';
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateWorkerDto {
  fullName: string;
  phone?: string;
  address?: string;
  hireDate: Date;
  specialty: 'molding' | 'painting' | 'finishing' | 'packaging';
  skillLevel: 'apprentice' | 'skilled' | 'master';
}

// Attendance interfaces
export interface Attendance {
  id: string;
  workerId: string;
  worker?: Worker;
  date: Date;
  checkIn?: Date;
  checkOut?: Date;
  shiftId?: string;
  status: 'present' | 'absent' | 'late' | 'early_leave';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CheckInDto {
  workerId: string;
  date: Date;
  shiftId?: string;
}

export interface CheckOutDto {
  attendanceId: string;
}

// Shift interfaces
export interface Shift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

export interface ShiftAssignment {
  id: string;
  workerId: string;
  worker?: Worker;
  shiftId: string;
  shift?: Shift;
  date: Date;
  status: 'assigned' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

// Payroll interfaces
export interface Payroll {
  id: string;
  workerId: string;
  worker?: Worker;
  month: number;
  year: number;
  baseSalary: number;
  overtimePay: number;
  nightShiftAllowance: number;
  holidayPay: number;
  deductions: number;
  advanceDeduction: number;
  netSalary: number;
  status: 'draft' | 'approved' | 'paid';
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdvancePayment {
  id: string;
  workerId: string;
  worker?: Worker;
  amount: number;
  date: Date;
  reason?: string;
  status: 'pending' | 'approved' | 'deducted';
  createdAt: Date;
  updatedAt: Date;
}

// Material interfaces
export interface Material {
  id: string;
  code: string;
  name: string;
  type: 'plaster' | 'mold' | 'paint' | 'accessory' | 'packaging';
  unit: string;
  purchasePrice: number;
  supplierId?: string;
  quantity: number;
  minQuantity?: number;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

export interface MaterialTransaction {
  id: string;
  materialId: string;
  material?: Material;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  referenceType?: string;
  referenceId?: string;
  notes?: string;
  createdAt: Date;
}

// Mold interfaces
export interface Mold {
  id: string;
  code: string;
  name: string;
  size?: string;
  productWeight?: number;
  status: 'available' | 'in_use' | 'maintenance' | 'broken';
  usageCount: number;
  lastMaintenanceDate?: Date;
  nextMaintenanceDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface MoldMaintenance {
  id: string;
  moldId: string;
  mold?: Mold;
  date: Date;
  type: 'routine' | 'repair';
  description?: string;
  cost?: number;
  performedBy?: string;
  createdAt: Date;
}

// Production Order interfaces
export interface ProductionOrder {
  id: string;
  code: string;
  productId: string;
  quantity: number;
  producedQuantity: number;
  defectQuantity: number;
  wasteQuantity: number;
  startDate: Date;
  expectedEndDate: Date;
  actualEndDate?: Date;
  status: 'draft' | 'in_progress' | 'paused' | 'completed' | 'cancelled';
  salesOrderId?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductionProgress {
  id: string;
  productionOrderId: string;
  stage: 'molding' | 'base_paint' | 'color_paint' | 'finishing' | 'inspection';
  completedQuantity: number;
  defectQuantity: number;
  workerId?: string;
  worker?: Worker;
  notes?: string;
  createdAt: Date;
}

export interface QualityInspection {
  id: string;
  productionOrderId: string;
  inspectionDate: Date;
  result: 'pass' | 'fail' | 'needs_repair';
  passedQuantity: number;
  failedQuantity: number;
  defectType?: string;
  defectDescription?: string;
  inspectorId?: string;
  createdAt: Date;
}

// Production Report interfaces
export interface ProductionReport {
  totalProduction: number;
  totalDefects: number;
  defectRate: number;
  completionRate: number;
  byProduct: Array<{
    productId: string;
    productName: string;
    quantity: number;
    defects: number;
  }>;
  byWorker: Array<{
    workerId: string;
    workerName: string;
    productivity: number;
    defectRate: number;
  }>;
}

// API Response interface
interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
  };
}

// Worker API
const workerApi = {
  getWorkers: async (params?: any) => {
    const response = await api.get<ApiResponse<Worker[]>>('/hr/workers', { params });
    return response.data;
  },

  getWorker: async (id: string) => {
    const response = await api.get<ApiResponse<Worker>>(`/hr/workers/${id}`);
    return response.data;
  },

  createWorker: async (data: CreateWorkerDto) => {
    const response = await api.post<ApiResponse<Worker>>('/hr/workers', data);
    return response.data;
  },

  updateWorker: async (id: string, data: Partial<CreateWorkerDto>) => {
    const response = await api.put<ApiResponse<Worker>>(`/hr/workers/${id}`, data);
    return response.data;
  },

  deleteWorker: (id: string) => api.delete(`/hr/workers/${id}`),
};

// Attendance API
const attendanceApi = {
  getAttendances: async (params?: any) => {
    const response = await api.get<ApiResponse<Attendance[]>>('/hr/attendances', { params });
    return response.data;
  },

  checkIn: async (data: CheckInDto) => {
    const response = await api.post<ApiResponse<Attendance>>('/hr/attendances/check-in', data);
    return response.data;
  },

  checkOut: async (data: CheckOutDto) => {
    const response = await api.post<ApiResponse<Attendance>>('/hr/attendances/check-out', data);
    return response.data;
  },

  getAttendanceReport: async (params: { startDate: Date; endDate: Date; workerId?: string }) => {
    const response = await api.get<ApiResponse<any>>('/hr/attendances/report', { params });
    return response.data;
  },
};

// Shift API
const shiftApi = {
  getShifts: () => api.get<ApiResponse<Shift[]>>('/hr/shifts'),

  getShiftAssignments: (params?: any) =>
    api.get<ApiResponse<ShiftAssignment[]>>('/hr/shift-assignments', { params }),

  createShiftAssignment: (data: any) =>
    api.post<ApiResponse<ShiftAssignment>>('/hr/shift-assignments', data),

  deleteShiftAssignment: (id: string) => api.delete(`/hr/shift-assignments/${id}`),
};

// Payroll API
const payrollApi = {
  getPayrolls: (params?: any) => api.get<ApiResponse<Payroll[]>>('/hr/payrolls', { params }),

  getPayroll: (id: string) => api.get<ApiResponse<Payroll>>(`/hr/payrolls/${id}`),

  calculatePayroll: (data: { month: number; year: number; workerId?: string }) =>
    api.post<ApiResponse<Payroll[]>>('/hr/payrolls/calculate', data),

  approvePayroll: (id: string) => api.post<ApiResponse<Payroll>>(`/hr/payrolls/${id}/approve`),

  payPayroll: (id: string, data: { paymentMethod: string; paymentDate: Date }) =>
    api.post<ApiResponse<Payroll>>(`/hr/payrolls/${id}/pay`, data),
};

// Advance Payment API
const advanceApi = {
  getAdvances: (params?: any) => api.get<ApiResponse<AdvancePayment[]>>('/hr/advances', { params }),

  createAdvance: (data: any) => api.post<ApiResponse<AdvancePayment>>('/hr/advances', data),

  approveAdvance: (id: string) =>
    api.post<ApiResponse<AdvancePayment>>(`/hr/advances/${id}/approve`),
};

// Piecework API
const pieceworkApi = {
  getPieceworkRecords: (params?: any) => api.get<ApiResponse<any[]>>('/hr/piecework', { params }),

  createPieceworkRecord: (data: any) => api.post<ApiResponse<any>>('/hr/piecework', data),

  getPieceworkStatistics: (params?: any) =>
    api.get<ApiResponse<any>>('/hr/piecework/statistics', { params }),

  deletePieceworkRecord: (id: string) => api.delete(`/hr/piecework/${id}`),
};

// Material API
const materialApi = {
  getMaterials: (params?: any) =>
    api.get<ApiResponse<Material[]>>('/production/materials', { params }),

  getMaterial: (id: string) => api.get<ApiResponse<Material>>(`/production/materials/${id}`),

  createMaterial: (data: any) => api.post<ApiResponse<Material>>('/production/materials', data),

  updateMaterial: (id: string, data: any) =>
    api.put<ApiResponse<Material>>(`/production/materials/${id}`, data),

  deleteMaterial: (id: string) => api.delete(`/production/materials/${id}`),

  getMaterialTransactions: (params?: any) =>
    api.get<ApiResponse<MaterialTransaction[]>>('/production/materials/transactions', { params }),

  createMaterialTransaction: (data: any) =>
    api.post<ApiResponse<MaterialTransaction>>('/production/materials/transactions', data),

  getMaterialAlerts: () => api.get<ApiResponse<Material[]>>('/production/materials/alerts'),
};

// Mold API
const moldApi = {
  getMolds: (params?: any) => api.get<ApiResponse<Mold[]>>('/production/molds', { params }),

  getMold: (id: string) => api.get<ApiResponse<Mold>>(`/production/molds/${id}`),

  createMold: (data: any) => api.post<ApiResponse<Mold>>('/production/molds', data),

  updateMold: (id: string, data: any) =>
    api.put<ApiResponse<Mold>>(`/production/molds/${id}`, data),

  deleteMold: (id: string) => api.delete(`/production/molds/${id}`),

  getMoldMaintenances: (moldId: string) =>
    api.get<ApiResponse<MoldMaintenance[]>>(`/production/molds/${moldId}/maintenances`),

  createMoldMaintenance: (moldId: string, data: any) =>
    api.post<ApiResponse<MoldMaintenance>>(`/production/molds/${moldId}/maintenances`, data),
};

// Production Order API
const productionOrderApi = {
  getProductionOrders: (params?: any) =>
    api.get<ApiResponse<ProductionOrder[]>>('/production/orders', { params }),

  getProductionOrder: (id: string) =>
    api.get<ApiResponse<ProductionOrder>>(`/production/orders/${id}`),

  createProductionOrder: (data: any) =>
    api.post<ApiResponse<ProductionOrder>>('/production/orders', data),

  updateProductionOrder: (id: string, data: any) =>
    api.put<ApiResponse<ProductionOrder>>(`/production/orders/${id}`, data),

  startProductionOrder: (id: string) =>
    api.post<ApiResponse<ProductionOrder>>(`/production/orders/${id}/start`),

  completeProductionOrder: (id: string) =>
    api.post<ApiResponse<ProductionOrder>>(`/production/orders/${id}/complete`),

  cancelProductionOrder: (id: string) =>
    api.post<ApiResponse<ProductionOrder>>(`/production/orders/${id}/cancel`),

  getProductionProgress: (orderId: string) =>
    api.get<ApiResponse<ProductionProgress[]>>(`/production/orders/${orderId}/progress`),

  updateProductionProgress: (orderId: string, data: any) =>
    api.post<ApiResponse<ProductionProgress>>(`/production/orders/${orderId}/progress`, data),

  getQualityInspections: (orderId: string) =>
    api.get<ApiResponse<QualityInspection[]>>(`/production/orders/${orderId}/inspections`),

  createQualityInspection: (orderId: string, data: any) =>
    api.post<ApiResponse<QualityInspection>>(`/production/orders/${orderId}/inspections`, data),
};

// Production Report API
const productionReportApi = {
  getProductionReport: (params: { startDate: Date; endDate: Date }) =>
    api.get<ApiResponse<ProductionReport>>('/production/reports/production', { params }),

  getMaterialConsumptionReport: (params: { startDate: Date; endDate: Date }) =>
    api.get<ApiResponse<any>>('/production/reports/material-consumption', { params }),

  getCostAnalysisReport: (params: { startDate: Date; endDate: Date }) =>
    api.get<ApiResponse<any>>('/production/reports/cost-analysis', { params }),
};

const productionService = {
  worker: workerApi,
  attendance: attendanceApi,
  shift: shiftApi,
  payroll: payrollApi,
  advance: advanceApi,
  piecework: pieceworkApi,
  material: materialApi,
  mold: moldApi,
  productionOrder: productionOrderApi,
  report: productionReportApi,
};

export default productionService;
