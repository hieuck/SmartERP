import api from '../api/apiService';

export interface Workflow {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  steps: any[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowInstance {
  id: string;
  tenantId: string;
  workflowId: string;
  entityType: string;
  entityId: string;
  currentStep: number;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected' | 'cancelled';
  initiatedBy: string;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateWorkflowDto {
  name: string;
  description?: string;
  steps: any[];
  isActive?: boolean;
}

export interface UpdateWorkflowDto {
  name?: string;
  description?: string;
  steps?: any[];
  isActive?: boolean;
}

export interface StartWorkflowDto {
  workflowId: string;
  entityType: string;
  entityId: string;
  initiatedBy: string;
}

export interface ApproveStepDto {
  approvedBy: string;
  notes?: string;
}

export interface RejectStepDto {
  rejectedBy: string;
  notes?: string;
}

const workflowService = {
  async getAllWorkflows(): Promise<Workflow[]> {
    const response = await api.get('/workflows');
    return response.data;
  },

  async getWorkflowById(id: string): Promise<Workflow> {
    const response = await api.get(`/workflows/${id}`);
    return response.data;
  },

  async createWorkflow(data: CreateWorkflowDto): Promise<Workflow> {
    const response = await api.post('/workflows', data);
    return response.data;
  },

  async updateWorkflow(id: string, data: UpdateWorkflowDto): Promise<Workflow> {
    const response = await api.put(`/workflows/${id}`, data);
    return response.data;
  },

  async deleteWorkflow(id: string): Promise<void> {
    await api.delete(`/workflows/${id}`);
  },

  async activateWorkflow(id: string): Promise<Workflow> {
    const response = await api.post(`/workflows/${id}/activate`);
    return response.data;
  },

  async getAllInstances(): Promise<WorkflowInstance[]> {
    const response = await api.get('/workflows/instances/all');
    return response.data;
  },

  async getInstanceById(id: string): Promise<WorkflowInstance> {
    const response = await api.get(`/workflows/instances/${id}`);
    return response.data;
  },

  async startWorkflow(data: StartWorkflowDto): Promise<WorkflowInstance> {
    const response = await api.post('/workflows/instances/start', data);
    return response.data;
  },

  async approveStep(id: string, data: ApproveStepDto): Promise<WorkflowInstance> {
    const response = await api.post(`/workflows/instances/${id}/approve`, data);
    return response.data;
  },

  async rejectStep(id: string, data: RejectStepDto): Promise<WorkflowInstance> {
    const response = await api.post(`/workflows/instances/${id}/reject`, data);
    return response.data;
  },

  async cancelInstance(id: string): Promise<WorkflowInstance> {
    const response = await api.post(`/workflows/instances/${id}/cancel`);
    return response.data;
  },
};

export default workflowService;
