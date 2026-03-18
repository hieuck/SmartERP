import api from '@/services/api/client';

// ─── Enums ────────────────────────────────────────────────────────────────────

export enum WorkOrderStatus {
  DRAFT = 'DRAFT',
  READY = 'READY',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum BOMType {
  MANUFACTURE = 'manufacture',
  KIT = 'kit',
}

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface WorkOrder {
  id: string;
  tenantId: string;
  reference: string;
  productId: string;
  product?: { id: string; name: string; code?: string };
  bomId?: string;
  bom?: { id: string; reference: string };
  qtyToProduce: number;
  qtyProduced: number;
  status: WorkOrderStatus;
  datePlannedStart?: string;
  datePlannedFinished?: string;
  dateStart?: string;
  dateFinished?: string;
  responsibleId?: string;
  responsible?: { id: string; name?: string; email?: string };
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BOMLine {
  id: string;
  productId: string;
  product?: { id: string; name: string; code?: string };
  quantity: number;
  unitCost: number;
}

export interface BOM {
  id: string;
  tenantId: string;
  reference: string;
  productId: string;
  product?: { id: string; name: string; code?: string };
  productQty: number;
  type: BOMType;
  isActive: boolean;
  totalCost: number;
  unitCost: number;
  lines: BOMLine[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkCenter {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  description?: string;
  timeEfficiency: number;
  capacityPerCycle: number;
  costPerHour: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── DTOs ─────────────────────────────────────────────────────────────────────

export interface CreateWorkOrderDto {
  productId: string;
  bomId?: string;
  qtyToProduce: number;
  datePlannedStart: string;
  datePlannedFinished?: string;
  responsibleId?: string;
  notes?: string;
}

export type UpdateWorkOrderDto = Partial<CreateWorkOrderDto>;

export interface BOMLineItemDto {
  productId: string;
  quantity: number;
  unitCost?: number;
}

export interface CreateBOMDto {
  productId: string;
  productQty: number;
  type: BOMType;
  isActive?: boolean;
  lines?: BOMLineItemDto[];
}

export type UpdateBOMDto = Partial<CreateBOMDto>;

export interface CreateWorkCenterDto {
  code: string;
  name: string;
  description?: string;
  timeEfficiency?: number;
  capacityPerCycle?: number;
  costPerHour?: number;
  isActive?: boolean;
}

export type UpdateWorkCenterDto = Partial<CreateWorkCenterDto>;

// ─── Service ──────────────────────────────────────────────────────────────────

const manufacturingService = {
  // Work Orders
  async getWorkOrders(): Promise<WorkOrder[]> {
    const res = await api.get('/manufacturing/work-orders');
    return res.data;
  },

  async getWorkOrdersByStatus(status: WorkOrderStatus): Promise<WorkOrder[]> {
    const res = await api.get(`/manufacturing/work-orders/status/${status}`);
    return res.data;
  },

  async getWorkOrderById(id: string): Promise<WorkOrder> {
    const res = await api.get(`/manufacturing/work-orders/${id}`);
    return res.data;
  },

  async createWorkOrder(dto: CreateWorkOrderDto): Promise<WorkOrder> {
    const res = await api.post('/manufacturing/work-orders', dto);
    return res.data;
  },

  async updateWorkOrder(id: string, dto: UpdateWorkOrderDto): Promise<WorkOrder> {
    const res = await api.patch(`/manufacturing/work-orders/${id}`, dto);
    return res.data;
  },

  async confirmWorkOrder(id: string): Promise<WorkOrder> {
    const res = await api.patch(`/manufacturing/work-orders/${id}/confirm`);
    return res.data;
  },

  async startWorkOrder(id: string): Promise<WorkOrder> {
    const res = await api.patch(`/manufacturing/work-orders/${id}/start`);
    return res.data;
  },

  async finishWorkOrder(id: string, producedQuantity: number): Promise<WorkOrder> {
    const res = await api.patch(`/manufacturing/work-orders/${id}/finish`, { producedQuantity });
    return res.data;
  },

  async cancelWorkOrder(id: string): Promise<WorkOrder> {
    const res = await api.patch(`/manufacturing/work-orders/${id}/cancel`);
    return res.data;
  },

  // BOMs
  async getBOMs(): Promise<BOM[]> {
    const res = await api.get('/manufacturing/bom');
    return res.data;
  },

  async getBOMsByProduct(productId: string): Promise<BOM[]> {
    const res = await api.get(`/manufacturing/bom/product/${productId}`);
    return res.data;
  },

  async getBOMById(id: string): Promise<BOM> {
    const res = await api.get(`/manufacturing/bom/${id}`);
    return res.data;
  },

  async createBOM(dto: CreateBOMDto): Promise<BOM> {
    const res = await api.post('/manufacturing/bom', dto);
    return res.data;
  },

  async updateBOM(id: string, dto: UpdateBOMDto): Promise<BOM> {
    const res = await api.patch(`/manufacturing/bom/${id}`, dto);
    return res.data;
  },

  async deleteBOM(id: string): Promise<void> {
    await api.delete(`/manufacturing/bom/${id}`);
  },

  async addBOMLine(bomId: string, dto: BOMLineItemDto): Promise<BOMLine> {
    const res = await api.post(`/manufacturing/bom/${bomId}/lines`, dto);
    return res.data;
  },

  async removeBOMLine(bomId: string, lineId: string): Promise<void> {
    await api.delete(`/manufacturing/bom/${bomId}/lines/${lineId}`);
  },

  // Work Centers
  async getWorkCenters(): Promise<WorkCenter[]> {
    const res = await api.get('/manufacturing/work-centers');
    return res.data;
  },

  async getWorkCenterById(id: string): Promise<WorkCenter> {
    const res = await api.get(`/manufacturing/work-centers/${id}`);
    return res.data;
  },

  async createWorkCenter(dto: CreateWorkCenterDto): Promise<WorkCenter> {
    const res = await api.post('/manufacturing/work-centers', dto);
    return res.data;
  },

  async updateWorkCenter(id: string, dto: UpdateWorkCenterDto): Promise<WorkCenter> {
    const res = await api.patch(`/manufacturing/work-centers/${id}`, dto);
    return res.data;
  },

  async deleteWorkCenter(id: string): Promise<void> {
    await api.delete(`/manufacturing/work-centers/${id}`);
  },
};

export default manufacturingService;
