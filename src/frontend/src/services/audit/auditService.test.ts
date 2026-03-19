import auditService, { AuditAction, AuditEntity } from './auditService';
import api from './api';
import { vi } from 'vitest';

vi.mock('./api');

const mockApiGet = vi.mocked(api.get);

describe('auditService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('gets audit logs with query params', async () => {
    const params = {
      page: 2,
      limit: 50,
      action: AuditAction.UPDATE,
      entity: AuditEntity.PRODUCT,
    };
    const mockResponse = { data: { data: [], meta: { total: 0 } } };
    mockApiGet.mockResolvedValue(mockResponse);

    const result = await auditService.getAll(params);

    expect(api.get).toHaveBeenCalledWith('/audit', { params });
    expect(result).toEqual(mockResponse.data);
  });

  it('gets an audit log by id', async () => {
    const mockLog = { id: 'audit-1', action: AuditAction.CREATE };
    mockApiGet.mockResolvedValue({ data: mockLog });

    const result = await auditService.getById('audit-1');

    expect(api.get).toHaveBeenCalledWith('/audit/audit-1');
    expect(result).toEqual(mockLog);
  });

  it('gets audit statistics', async () => {
    const mockStats = {
      totalLogs: 12,
      byAction: { [AuditAction.CREATE]: 5 },
      byEntity: { [AuditEntity.ORDER]: 3 },
      topUsers: [{ userId: 'user-1', count: 4 }],
    };
    mockApiGet.mockResolvedValue({ data: mockStats });

    const result = await auditService.getStatistics();

    expect(api.get).toHaveBeenCalledWith('/audit/statistics');
    expect(result).toEqual(mockStats);
  });

  it('gets timeline with default days', async () => {
    const mockTimeline = [{ date: '2026-03-19', count: 8, actions: [] }];
    mockApiGet.mockResolvedValue({ data: mockTimeline });

    const result = await auditService.getTimeline();

    expect(api.get).toHaveBeenCalledWith('/audit/timeline', { params: { days: 30 } });
    expect(result).toEqual(mockTimeline);
  });

  it('gets timeline with custom days', async () => {
    const mockTimeline = [{ date: '2026-03-18', count: 3, actions: [] }];
    mockApiGet.mockResolvedValue({ data: mockTimeline });

    const result = await auditService.getTimeline(7);

    expect(api.get).toHaveBeenCalledWith('/audit/timeline', { params: { days: 7 } });
    expect(result).toEqual(mockTimeline);
  });

  it('gets audit logs by entity', async () => {
    const mockLogs = [{ id: 'audit-1' }, { id: 'audit-2' }];
    mockApiGet.mockResolvedValue({ data: mockLogs });

    const result = await auditService.getByEntity(AuditEntity.ORDER, 'order-1');

    expect(api.get).toHaveBeenCalledWith('/audit/entity/ORDER/order-1');
    expect(result).toEqual(mockLogs);
  });

  it('gets audit logs by user', async () => {
    const mockLogs = [{ id: 'audit-1' }];
    mockApiGet.mockResolvedValue({ data: mockLogs });

    const result = await auditService.getByUser('user-1');

    expect(api.get).toHaveBeenCalledWith('/audit/user/user-1');
    expect(result).toEqual(mockLogs);
  });
});
