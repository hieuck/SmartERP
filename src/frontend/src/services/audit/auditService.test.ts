import auditService, { AuditAction, AuditEntity } from './auditService';
import api from './api';
import { vi } from 'vitest';

vi.mock('./api');

const mockApiGet = vi.mocked(api.get);

describe('auditService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('gets audit logs with query params and paginates on the client', async () => {
    const params = {
      page: 2,
      limit: 1,
      action: AuditAction.UPDATE,
      entity: AuditEntity.PRODUCT,
    };
    mockApiGet.mockResolvedValue({
      data: {
        data: [
          { id: 'audit-1', action: AuditAction.CREATE, entityType: AuditEntity.PRODUCT },
          { id: 'audit-2', action: AuditAction.UPDATE, entityType: AuditEntity.PRODUCT },
          { id: 'audit-3', action: AuditAction.UPDATE, entityType: AuditEntity.USER },
        ],
      },
    });

    const result = await auditService.getAll(params);

    expect(api.get).toHaveBeenCalledWith('/audit/logs', {
      params: {
        startDate: undefined,
        endDate: undefined,
        userId: undefined,
        entityType: AuditEntity.PRODUCT,
      },
    });
    expect(result).toEqual({
      data: [
        { id: 'audit-3', action: AuditAction.UPDATE, entityType: AuditEntity.USER, entity: AuditEntity.USER, entityId: '' },
      ],
      total: 2,
    });
  });

  it('gets an audit log by id from the logs endpoint', async () => {
    const mockLog = { id: 'audit-1', action: AuditAction.CREATE, entityType: AuditEntity.USER };
    mockApiGet.mockResolvedValue({ data: { data: [mockLog] } });

    const result = await auditService.getById('audit-1');

    expect(api.get).toHaveBeenCalledWith('/audit/logs');
    expect(result).toEqual({ ...mockLog, entity: AuditEntity.USER, entityId: '' });
  });

  it('gets audit statistics from summary', async () => {
    mockApiGet.mockResolvedValue({
      data: {
        data: {
          total: 12,
          byAction: { [AuditAction.CREATE]: 5 },
          byEntityType: { [AuditEntity.ORDER]: 3 },
          byUser: { 'user-1': 4, 'user-2': 2 },
        },
      },
    });

    const result = await auditService.getStatistics();

    expect(api.get).toHaveBeenCalledWith('/audit/summary', {
      params: expect.objectContaining({
        startDate: expect.any(String),
        endDate: expect.any(String),
      }),
    });
    expect(result).toEqual({
      totalLogs: 12,
      byAction: { [AuditAction.CREATE]: 5 },
      byEntity: { [AuditEntity.ORDER]: 3 },
      topUsers: [
        { userId: 'user-1', count: 4 },
        { userId: 'user-2', count: 2 },
      ],
    });
  });

  it('builds timeline from logs with default days', async () => {
    mockApiGet.mockResolvedValue({
      data: {
        data: [
          { id: 'audit-1', action: AuditAction.CREATE, entityType: AuditEntity.ORDER, createdAt: '2026-03-19T08:00:00.000Z' },
          { id: 'audit-2', action: AuditAction.CREATE, entityType: AuditEntity.ORDER, createdAt: '2026-03-19T10:00:00.000Z' },
          { id: 'audit-3', action: AuditAction.DELETE, entityType: AuditEntity.ORDER, createdAt: '2026-03-20T10:00:00.000Z' },
        ],
      },
    });

    const result = await auditService.getTimeline();

    expect(api.get).toHaveBeenCalledWith('/audit/logs', {
      params: expect.objectContaining({
        startDate: expect.any(String),
        endDate: expect.any(String),
      }),
    });
    expect(result).toEqual([
      {
        date: '2026-03-19',
        count: 2,
        actions: [{ action: AuditAction.CREATE, count: 2 }],
      },
      {
        date: '2026-03-20',
        count: 1,
        actions: [{ action: AuditAction.DELETE, count: 1 }],
      },
    ]);
  });

  it('gets audit logs by entity', async () => {
    const mockLogs = [{ id: 'audit-1', entityType: AuditEntity.ORDER }];
    mockApiGet.mockResolvedValue({ data: { data: mockLogs } });

    const result = await auditService.getByEntity(AuditEntity.ORDER, 'order-1');

    expect(api.get).toHaveBeenCalledWith('/audit/logs/entity/ORDER/order-1');
    expect(result).toEqual([{ ...mockLogs[0], entity: AuditEntity.ORDER, entityId: '' }]);
  });

  it('gets audit logs by user', async () => {
    const mockLogs = [{ id: 'audit-1', entityType: AuditEntity.USER }];
    mockApiGet.mockResolvedValue({ data: { data: mockLogs } });

    const result = await auditService.getByUser('user-1');

    expect(api.get).toHaveBeenCalledWith('/audit/logs/user/user-1');
    expect(result).toEqual([{ ...mockLogs[0], entity: AuditEntity.USER, entityId: '' }]);
  });
});
