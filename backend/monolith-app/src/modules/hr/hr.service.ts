import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Employee, EmploymentStatus } from './entities/employee.entity';
import { Attendance, AttendanceStatus } from './entities/attendance.entity';
import { Leave, LeaveStatus } from './entities/leave.entity';
import { CacheService } from '@/common/cache/cache.service';
import { CacheTTL, generateCacheKey } from '@/common/cache/cache.config';

@Injectable()
export class HrService {
  constructor(
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    @InjectRepository(Attendance)
    private readonly attendanceRepository: Repository<Attendance>,
    @InjectRepository(Leave)
    private readonly leaveRepository: Repository<Leave>,
    private readonly cacheService: CacheService,
  ) {}

  // ==================== EMPLOYEES ====================

  async findAllEmployees(tenantId: string): Promise<Employee[]> {
    return this.employeeRepository
      .createQueryBuilder('employee')
      .select([
        'employee.id',
        'employee.firstName',
        'employee.lastName',
        'employee.email',
        'employee.phone',
        'employee.department',
        'employee.position',
        'employee.status',
        'employee.hireDate',
        'employee.createdAt',
      ])
      .where('employee.tenantId = :tenantId', { tenantId })
      .orderBy('employee.createdAt', 'DESC')
      .getMany();
  }

  async findEmployeeById(tenantId: string, id: string): Promise<Employee> {
    const cacheKey = generateCacheKey('employee', tenantId, id);
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const employee = await this.employeeRepository.findOne({
          where: { id, tenantId },
        });

        if (!employee) {
          throw new NotFoundException(`Employee with ID ${id} not found`);
        }

        return employee;
      },
      CacheTTL.MEDIUM,
    );
  }

  async findEmployeeByEmail(tenantId: string, email: string): Promise<Employee | null> {
    return this.employeeRepository.findOne({
      where: { email, tenantId },
    });
  }

  async createEmployee(tenantId: string, data: Partial<Employee>): Promise<Employee> {
    // Check email uniqueness
    const existingEmployee = await this.findEmployeeByEmail(tenantId, data.email);
    if (existingEmployee) {
      throw new ConflictException(`Employee with email ${data.email} already exists`);
    }

    const employee = this.employeeRepository.create({ ...data, tenantId });
    return this.employeeRepository.save(employee);
  }

  async updateEmployee(tenantId: string, id: string, data: Partial<Employee>): Promise<Employee> {
    const employee = await this.findEmployeeById(tenantId, id);

    // Check email uniqueness if being updated
    if (data.email && data.email !== employee.email) {
      const existingEmployee = await this.findEmployeeByEmail(tenantId, data.email);
      if (existingEmployee) {
        throw new ConflictException(`Employee with email ${data.email} already exists`);
      }
    }

    Object.assign(employee, data);
    const updated = await this.employeeRepository.save(employee);

    // Invalidate cache
    const cacheKey = generateCacheKey('employee', tenantId, id);
    await this.cacheService.del(cacheKey);

    return updated;
  }

  async deleteEmployee(tenantId: string, id: string): Promise<void> {
    const employee = await this.findEmployeeById(tenantId, id);
    await this.employeeRepository.softDelete(employee.id);

    // Invalidate cache
    const cacheKey = generateCacheKey('employee', tenantId, id);
    await this.cacheService.del(cacheKey);
  }

  async findEmployeesByDepartment(tenantId: string, department: string): Promise<Employee[]> {
    return this.employeeRepository
      .createQueryBuilder('employee')
      .select([
        'employee.id',
        'employee.firstName',
        'employee.lastName',
        'employee.email',
        'employee.position',
        'employee.status',
        'employee.hireDate',
      ])
      .where('employee.tenantId = :tenantId', { tenantId })
      .andWhere('employee.department = :department', { department })
      .orderBy('employee.lastName', 'ASC')
      .getMany();
  }

  async findEmployeesByStatus(tenantId: string, status: EmploymentStatus): Promise<Employee[]> {
    return this.employeeRepository
      .createQueryBuilder('employee')
      .select([
        'employee.id',
        'employee.firstName',
        'employee.lastName',
        'employee.email',
        'employee.department',
        'employee.position',
        'employee.status',
        'employee.hireDate',
      ])
      .where('employee.tenantId = :tenantId', { tenantId })
      .andWhere('employee.status = :status', { status })
      .orderBy('employee.lastName', 'ASC')
      .getMany();
  }

  async countEmployees(tenantId: string): Promise<number> {
    return this.employeeRepository.count({ where: { tenantId } });
  }

  // ==================== ATTENDANCE ====================

  async findAllAttendance(
    tenantId: string,
    employeeId?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<Attendance[]> {
    const where: Record<string, unknown> = { tenantId };
    if (employeeId) {
      where.employeeId = employeeId;
    }
    if (startDate && endDate) {
      where.date = Between(startDate, endDate);
    }

    return this.attendanceRepository.find({
      where,
      order: { date: 'DESC' },
    });
  }

  async findAttendanceById(tenantId: string, id: string): Promise<Attendance> {
    const cacheKey = generateCacheKey('attendance', tenantId, id);
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const attendance = await this.attendanceRepository.findOne({
          where: { id, tenantId },
        });

        if (!attendance) {
          throw new NotFoundException(`Attendance record with ID ${id} not found`);
        }

        return attendance;
      },
      CacheTTL.MEDIUM,
    );
  }

  async createAttendance(tenantId: string, data: Partial<Attendance>): Promise<Attendance> {
    // Verify employee exists
    await this.findEmployeeById(tenantId, data.employeeId);

    const attendance = this.attendanceRepository.create({ ...data, tenantId });
    return this.attendanceRepository.save(attendance);
  }

  async updateAttendance(
    tenantId: string,
    id: string,
    data: Partial<Attendance>,
  ): Promise<Attendance> {
    const attendance = await this.findAttendanceById(tenantId, id);
    Object.assign(attendance, data);
    const updated = await this.attendanceRepository.save(attendance);

    // Invalidate cache
    const cacheKey = generateCacheKey('attendance', tenantId, id);
    await this.cacheService.del(cacheKey);

    return updated;
  }

  async deleteAttendance(tenantId: string, id: string): Promise<void> {
    const attendance = await this.findAttendanceById(tenantId, id);
    await this.attendanceRepository.delete(attendance.id);

    // Invalidate cache
    const cacheKey = generateCacheKey('attendance', tenantId, id);
    await this.cacheService.del(cacheKey);
  }

  async getAttendanceStatistics(
    tenantId: string,
    employeeId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{
    total: number;
    present: number;
    absent: number;
    late: number;
    halfDay: number;
    attendanceRate: number;
  }> {
    const attendance = await this.findAllAttendance(tenantId, employeeId, startDate, endDate);

    const total = attendance.length;
    const present = attendance.filter((a) => a.status === AttendanceStatus.PRESENT).length;
    const absent = attendance.filter((a) => a.status === AttendanceStatus.ABSENT).length;
    const late = attendance.filter((a) => a.status === AttendanceStatus.LATE).length;
    const halfDay = attendance.filter((a) => a.status === AttendanceStatus.HALF_DAY).length;

    return {
      total,
      present,
      absent,
      late,
      halfDay,
      attendanceRate: total > 0 ? (present / total) * 100 : 0,
    };
  }

  // ==================== LEAVE ====================

  async findAllLeaves(
    tenantId: string,
    employeeId?: string,
    status?: LeaveStatus,
  ): Promise<Leave[]> {
    const where: { tenantId: string; employeeId?: string; status?: LeaveStatus } = { tenantId };
    if (employeeId) {
      where.employeeId = employeeId;
    }
    if (status) {
      where.status = status;
    }

    return this.leaveRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async findLeaveById(tenantId: string, id: string): Promise<Leave> {
    const cacheKey = generateCacheKey('leave', tenantId, id);
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const leave = await this.leaveRepository.findOne({
          where: { id, tenantId },
        });

        if (!leave) {
          throw new NotFoundException(`Leave request with ID ${id} not found`);
        }

        return leave;
      },
      CacheTTL.MEDIUM,
    );
  }

  async createLeave(tenantId: string, data: Partial<Leave>): Promise<Leave> {
    // Verify employee exists
    await this.findEmployeeById(tenantId, data.employeeId);

    // Calculate days if not provided
    if (!data.days && data.startDate && data.endDate) {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      data.days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }

    const leave = this.leaveRepository.create({ ...data, tenantId });
    return this.leaveRepository.save(leave);
  }

  async updateLeave(tenantId: string, id: string, data: Partial<Leave>): Promise<Leave> {
    const leave = await this.findLeaveById(tenantId, id);
    Object.assign(leave, data);
    const updated = await this.leaveRepository.save(leave);

    // Invalidate cache
    const cacheKey = generateCacheKey('leave', tenantId, id);
    await this.cacheService.del(cacheKey);

    return updated;
  }

  async deleteLeave(tenantId: string, id: string): Promise<void> {
    const leave = await this.findLeaveById(tenantId, id);
    await this.leaveRepository.delete(leave.id);

    // Invalidate cache
    const cacheKey = generateCacheKey('leave', tenantId, id);
    await this.cacheService.del(cacheKey);
  }

  async approveLeave(tenantId: string, id: string, approvedBy: string): Promise<Leave> {
    const leave = await this.findLeaveById(tenantId, id);

    if (leave.status !== LeaveStatus.PENDING) {
      throw new BadRequestException('Only pending leaves can be approved');
    }

    leave.status = LeaveStatus.APPROVED;
    leave.approvedBy = approvedBy;
    leave.approvedAt = new Date();

    const updated = await this.leaveRepository.save(leave);

    // Invalidate cache
    const cacheKey = generateCacheKey('leave', tenantId, id);
    await this.cacheService.del(cacheKey);

    return updated;
  }

  async rejectLeave(tenantId: string, id: string): Promise<Leave> {
    const leave = await this.findLeaveById(tenantId, id);

    if (leave.status !== LeaveStatus.PENDING) {
      throw new BadRequestException('Only pending leaves can be rejected');
    }

    leave.status = LeaveStatus.REJECTED;

    const updated = await this.leaveRepository.save(leave);

    // Invalidate cache
    const cacheKey = generateCacheKey('leave', tenantId, id);
    await this.cacheService.del(cacheKey);

    return updated;
  }

  async getLeaveBalance(
    tenantId: string,
    employeeId: string,
    year: number,
  ): Promise<{
    year: number;
    totalDaysTaken: number;
    annualLeaveAllowance: number;
    remainingDays: number;
  }> {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    const leaves = await this.leaveRepository.find({
      where: {
        tenantId,
        employeeId,
        status: LeaveStatus.APPROVED,
      },
    });

    const leavesInYear = leaves.filter((l) => {
      const leaveDate = new Date(l.startDate);
      return leaveDate >= startDate && leaveDate <= endDate;
    });

    const totalDays = leavesInYear.reduce((sum, l) => sum + l.days, 0);

    return {
      year,
      totalDaysTaken: totalDays,
      annualLeaveAllowance: 12, // Default, should be configurable
      remainingDays: 12 - totalDays,
    };
  }
}
