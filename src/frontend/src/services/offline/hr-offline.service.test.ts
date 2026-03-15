import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  EmployeeOfflineService,
  DepartmentOfflineService,
  PositionOfflineService,
} from './hr-offline.service';
import { db, SyncStatus } from '@/lib/offline/db';

vi.mock('@/lib/offline/sync-manager', () => ({
  syncManager: {
    queueOperation: vi.fn(),
  },
}));

describe('HR Offline Services', () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
    vi.clearAllMocks();
  });

  describe('EmployeeOfflineService', () => {
    let service: EmployeeOfflineService;

    beforeEach(() => {
      service = new EmployeeOfflineService();
    });

    it('should create employee', async () => {
      const employee = await service.create({
        tenantId: 'tenant1',
        employeeNumber: 'EMP001',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        hireDate: new Date(),
        status: 'active',
      } as any);

      expect(employee.id).toBeDefined();
      expect(employee.firstName).toBe('John');
      expect(employee.syncStatus).toBe(SyncStatus.PENDING);
    });

    it('should get employee by email', async () => {
      await service.create({
        tenantId: 'tenant1',
        employeeNumber: 'EMP001',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        hireDate: new Date(),
        status: 'active',
      } as any);

      const found = await service.getByEmail('john@example.com');
      expect(found).toBeDefined();
      expect(found?.firstName).toBe('John');
    });

    it('should get active employees', async () => {
      await service.create({
        tenantId: 'tenant1',
        employeeNumber: 'EMP001',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        hireDate: new Date(),
        status: 'active',
      } as any);

      const active = await service.getActive();
      expect(active.length).toBeGreaterThan(0);
    });
  });

  describe('DepartmentOfflineService', () => {
    let service: DepartmentOfflineService;

    beforeEach(() => {
      service = new DepartmentOfflineService();
    });

    it('should create department', async () => {
      const department = await service.create({
        tenantId: 'tenant1',
        departmentCode: 'DEPT001',
        departmentName: 'Engineering',
        isActive: true,
      } as any);

      expect(department.id).toBeDefined();
      expect(department.departmentName).toBe('Engineering');
      expect(department.syncStatus).toBe(SyncStatus.PENDING);
    });

    it('should get active departments', async () => {
      await service.create({
        tenantId: 'tenant1',
        departmentCode: 'DEPT001',
        departmentName: 'Engineering',
        isActive: true,
      } as any);

      const active = await service.getActive();
      expect(active.length).toBeGreaterThan(0);
    });
  });

  describe('PositionOfflineService', () => {
    let service: PositionOfflineService;

    beforeEach(() => {
      service = new PositionOfflineService();
    });

    it('should create position', async () => {
      const position = await service.create({
        tenantId: 'tenant1',
        positionCode: 'POS001',
        positionName: 'Software Engineer',
        isActive: true,
      } as any);

      expect(position.id).toBeDefined();
      expect(position.positionName).toBe('Software Engineer');
      expect(position.syncStatus).toBe(SyncStatus.PENDING);
    });

    it('should get active positions', async () => {
      await service.create({
        tenantId: 'tenant1',
        positionCode: 'POS001',
        positionName: 'Software Engineer',
        isActive: true,
      } as any);

      const active = await service.getActive();
      expect(active.length).toBeGreaterThan(0);
    });
  });
});
