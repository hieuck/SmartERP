import workflowService, {
  type ApproveStepDto,
  type CreateWorkflowDto,
  type RejectStepDto,
  type StartWorkflowDto,
  type UpdateWorkflowDto,
} from './workflowService';
import api from './api';
import { vi } from 'vitest';

vi.mock('./api');

const mockApiGet = vi.mocked(api.get);
const mockApiPost = vi.mocked(api.post);
const mockApiPut = vi.mocked(api.put);
const mockApiDelete = vi.mocked(api.delete);

describe('workflowService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('gets all workflows', async () => {
    const workflows = [{ id: 'wf-1', name: 'Purchase approval' }];
    mockApiGet.mockResolvedValue({ data: workflows });

    const result = await workflowService.getAllWorkflows();

    expect(api.get).toHaveBeenCalledWith('/workflows');
    expect(result).toEqual(workflows);
  });

  it('gets a workflow by id', async () => {
    const workflow = { id: 'wf-1', name: 'Purchase approval' };
    mockApiGet.mockResolvedValue({ data: workflow });

    const result = await workflowService.getWorkflowById('wf-1');

    expect(api.get).toHaveBeenCalledWith('/workflows/wf-1');
    expect(result).toEqual(workflow);
  });

  it('creates a workflow', async () => {
    const payload: CreateWorkflowDto = {
      name: 'Purchase approval',
      description: 'Approves high-value purchases',
      steps: [{ id: 'step-1', name: 'Manager approval', type: 'approval', order: 1 }],
      isActive: true,
    };
    const created = { id: 'wf-1', ...payload };
    mockApiPost.mockResolvedValue({ data: created });

    const result = await workflowService.createWorkflow(payload);

    expect(api.post).toHaveBeenCalledWith('/workflows', payload);
    expect(result).toEqual(created);
  });

  it('updates a workflow', async () => {
    const payload: UpdateWorkflowDto = { name: 'Updated workflow', isActive: false };
    const updated = { id: 'wf-1', ...payload };
    mockApiPut.mockResolvedValue({ data: updated });

    const result = await workflowService.updateWorkflow('wf-1', payload);

    expect(api.put).toHaveBeenCalledWith('/workflows/wf-1', payload);
    expect(result).toEqual(updated);
  });

  it('deletes a workflow', async () => {
    mockApiDelete.mockResolvedValue({ data: undefined });

    await workflowService.deleteWorkflow('wf-1');

    expect(api.delete).toHaveBeenCalledWith('/workflows/wf-1');
  });

  it('activates a workflow', async () => {
    const activated = { id: 'wf-1', isActive: true };
    mockApiPost.mockResolvedValue({ data: activated });

    const result = await workflowService.activateWorkflow('wf-1');

    expect(api.post).toHaveBeenCalledWith('/workflows/wf-1/activate');
    expect(result).toEqual(activated);
  });

  it('gets all workflow instances and a single instance by id', async () => {
    const instances = [{ id: 'instance-1', status: 'pending' }];
    const instance = { id: 'instance-1', status: 'in_progress' };
    mockApiGet.mockResolvedValueOnce({ data: instances });
    mockApiGet.mockResolvedValueOnce({ data: instance });

    const all = await workflowService.getAllInstances();
    const single = await workflowService.getInstanceById('instance-1');

    expect(api.get).toHaveBeenNthCalledWith(1, '/workflows/instances/all');
    expect(api.get).toHaveBeenNthCalledWith(2, '/workflows/instances/instance-1');
    expect(all).toEqual(instances);
    expect(single).toEqual(instance);
  });

  it('starts a workflow instance', async () => {
    const payload: StartWorkflowDto = {
      workflowId: 'wf-1',
      entityType: 'purchase_order',
      entityId: 'po-1',
      initiatedBy: 'user-1',
    };
    const instance = { id: 'instance-1', ...payload, status: 'pending' };
    mockApiPost.mockResolvedValue({ data: instance });

    const result = await workflowService.startWorkflow(payload);

    expect(api.post).toHaveBeenCalledWith('/workflows/instances/start', payload);
    expect(result).toEqual(instance);
  });

  it('approves and rejects workflow steps with their payloads', async () => {
    const approvePayload: ApproveStepDto = { approvedBy: 'manager-1', notes: 'Looks good' };
    const rejectPayload: RejectStepDto = { rejectedBy: 'manager-2', notes: 'Need more info' };
    const approved = { id: 'instance-1', status: 'in_progress' };
    const rejected = { id: 'instance-1', status: 'rejected' };
    mockApiPost.mockResolvedValueOnce({ data: approved });
    mockApiPost.mockResolvedValueOnce({ data: rejected });

    const approvedResult = await workflowService.approveStep('instance-1', approvePayload);
    const rejectedResult = await workflowService.rejectStep('instance-1', rejectPayload);

    expect(api.post).toHaveBeenNthCalledWith(
      1,
      '/workflows/instances/instance-1/approve',
      approvePayload,
    );
    expect(api.post).toHaveBeenNthCalledWith(
      2,
      '/workflows/instances/instance-1/reject',
      rejectPayload,
    );
    expect(approvedResult).toEqual(approved);
    expect(rejectedResult).toEqual(rejected);
  });

  it('cancels a workflow instance', async () => {
    const cancelled = { id: 'instance-1', status: 'cancelled' };
    mockApiPost.mockResolvedValue({ data: cancelled });

    const result = await workflowService.cancelInstance('instance-1');

    expect(api.post).toHaveBeenCalledWith('/workflows/instances/instance-1/cancel');
    expect(result).toEqual(cancelled);
  });
});
