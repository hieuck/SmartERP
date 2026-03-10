import api from './api';

/**
 * Workflow step configuration
 */
export interface WorkflowStep {
  id: string;
  name: string;
  description?: string;
  type: 'approval' | 'notification' | 'action' | 'condition';
  assignees?: string[];
  conditions?: Record<string, unknown>;
  actions?: Record<string, unknown>;
  order: number;
}

/**
 * Workflow definition
 */
export interface Workflow {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  steps: WorkflowStep[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Workflow instance (runtime execution)
 */
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

/**
 * DTO for creating a workflow
 */
export interface CreateWorkflowDto {
  name: string;
  description?: string;
  steps: WorkflowStep[];
  isActive?: boolean;
}

/**
 * DTO for updating a workflow
 */
export interface UpdateWorkflowDto {
  name?: string;
  description?: string;
  steps?: WorkflowStep[];
  isActive?: boolean;
}

/**
 * DTO for starting a workflow instance
 */
export interface StartWorkflowDto {
  workflowId: string;
  entityType: string;
  entityId: string;
  initiatedBy: string;
}

/**
 * DTO for approving a workflow step
 */
export interface ApproveStepDto {
  approvedBy: string;
  notes?: string;
}

/**
 * DTO for rejecting a workflow step
 */
export interface RejectStepDto {
  rejectedBy: string;
  notes?: string;
}

/**
 * Workflow service for managing workflows and instances
 */
const workflowService = {
  /**
   * Get all workflows
   * @returns Array of workflows
   */
  async getAllWorkflows(): Promise<Workflow[]> {
    const response = await api.get('/workflows');
    return response.data;
  },

  /**
   * Get workflow by ID
   * @param id - Workflow ID
   * @returns Workflow details
   */
  async getWorkflowById(id: string): Promise<Workflow> {
    const response = await api.get(`/workflows/${id}`);
    return response.data;
  },

  /**
   * Create a new workflow
   * @param data - Workflow creation data
   * @returns Created workflow
   */
  async createWorkflow(data: CreateWorkflowDto): Promise<Workflow> {
    const response = await api.post('/workflows', data);
    return response.data;
  },

  /**
   * Update an existing workflow
   * @param id - Workflow ID
   * @param data - Workflow update data
   * @returns Updated workflow
   */
  async updateWorkflow(id: string, data: UpdateWorkflowDto): Promise<Workflow> {
    const response = await api.put(`/workflows/${id}`, data);
    return response.data;
  },

  /**
   * Delete a workflow
   * @param id - Workflow ID
   */
  async deleteWorkflow(id: string): Promise<void> {
    await api.delete(`/workflows/${id}`);
  },

  /**
   * Activate a workflow
   * @param id - Workflow ID
   * @returns Activated workflow
   */
  async activateWorkflow(id: string): Promise<Workflow> {
    const response = await api.post(`/workflows/${id}/activate`);
    return response.data;
  },

  /**
   * Get all workflow instances
   * @returns Array of workflow instances
   */
  async getAllInstances(): Promise<WorkflowInstance[]> {
    const response = await api.get('/workflows/instances/all');
    return response.data;
  },

  /**
   * Get workflow instance by ID
   * @param id - Instance ID
   * @returns Workflow instance details
   */
  async getInstanceById(id: string): Promise<WorkflowInstance> {
    const response = await api.get(`/workflows/instances/${id}`);
    return response.data;
  },

  /**
   * Start a new workflow instance
   * @param data - Workflow start data
   * @returns Created workflow instance
   */
  async startWorkflow(data: StartWorkflowDto): Promise<WorkflowInstance> {
    const response = await api.post('/workflows/instances/start', data);
    return response.data;
  },

  /**
   * Approve a workflow step
   * @param id - Instance ID
   * @param data - Approval data
   * @returns Updated workflow instance
   */
  async approveStep(id: string, data: ApproveStepDto): Promise<WorkflowInstance> {
    const response = await api.post(`/workflows/instances/${id}/approve`, data);
    return response.data;
  },

  /**
   * Reject a workflow step
   * @param id - Instance ID
   * @param data - Rejection data
   * @returns Updated workflow instance
   */
  async rejectStep(id: string, data: RejectStepDto): Promise<WorkflowInstance> {
    const response = await api.post(`/workflows/instances/${id}/reject`, data);
    return response.data;
  },

  /**
   * Cancel a workflow instance
   * @param id - Instance ID
   * @returns Cancelled workflow instance
   */
  async cancelInstance(id: string): Promise<WorkflowInstance> {
    const response = await api.post(`/workflows/instances/${id}/cancel`);
    return response.data;
  },
};

export default workflowService;
