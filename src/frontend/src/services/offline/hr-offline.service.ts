import { db, Employee, Department, Position, Shift } from '@/lib/offline/db';
import { BaseOfflineService } from './base-offline.service';

/**
 * Employee offline service
 */
export class EmployeeOfflineService extends BaseOfflineService<Employee> {
  constructor() {
    super(db.employees, 'employees');
  }

  async getByEmployeeNumber(employeeNumber: string): Promise<Employee | undefined> {
    return db.employees.where('employeeNumber').equals(employeeNumber).first();
  }

  async getByEmail(email: string): Promise<Employee | undefined> {
    return db.employees.where('email').equals(email).first();
  }

  async getByDepartment(departmentId: string): Promise<Employee[]> {
    return db.employees.where('departmentId').equals(departmentId).toArray();
  }

  async getByPosition(positionId: string): Promise<Employee[]> {
    return db.employees.where('positionId').equals(positionId).toArray();
  }

  async getByStatus(status: string): Promise<Employee[]> {
    return db.employees.where('status').equals(status).toArray();
  }

  async getActive(): Promise<Employee[]> {
    return db.employees.where('status').equals('active').toArray();
  }
}

/**
 * Department offline service
 */
export class DepartmentOfflineService extends BaseOfflineService<Department> {
  constructor() {
    super(db.departments, 'departments');
  }

  async getByDepartmentCode(departmentCode: string): Promise<Department | undefined> {
    return db.departments.where('departmentCode').equals(departmentCode).first();
  }

  async getActive(): Promise<Department[]> {
    return db.departments.where('isActive').equals(1).toArray();
  }

  async getByManager(managerId: string): Promise<Department[]> {
    const all = await db.departments.toArray();
    return all.filter(dept => dept.managerId === managerId);
  }

  async getSubDepartments(parentDepartmentId: string): Promise<Department[]> {
    const all = await db.departments.toArray();
    return all.filter(dept => dept.parentDepartmentId === parentDepartmentId);
  }
}

/**
 * Position offline service
 */
export class PositionOfflineService extends BaseOfflineService<Position> {
  constructor() {
    super(db.positions, 'positions');
  }

  async getByPositionCode(positionCode: string): Promise<Position | undefined> {
    return db.positions.where('positionCode').equals(positionCode).first();
  }

  async getByDepartment(departmentId: string): Promise<Position[]> {
    return db.positions.where('departmentId').equals(departmentId).toArray();
  }

  async getActive(): Promise<Position[]> {
    return db.positions.where('isActive').equals(1).toArray();
  }

  async getByLevel(level: string): Promise<Position[]> {
    const all = await db.positions.toArray();
    return all.filter(pos => pos.level === level && pos.isActive);
  }
}

/**
 * Shift offline service
 */
export class ShiftOfflineService extends BaseOfflineService<Shift> {
  constructor() {
    super(db.shifts, 'shifts');
  }

  async getByShiftCode(shiftCode: string): Promise<Shift | undefined> {
    return db.shifts.where('shiftCode').equals(shiftCode).first();
  }

  async getActive(): Promise<Shift[]> {
    return db.shifts.where('isActive').equals(1).toArray();
  }
}

// Export singleton instances
export const employeeOfflineService = new EmployeeOfflineService();
export const departmentOfflineService = new DepartmentOfflineService();
export const positionOfflineService = new PositionOfflineService();
export const shiftOfflineService = new ShiftOfflineService();
