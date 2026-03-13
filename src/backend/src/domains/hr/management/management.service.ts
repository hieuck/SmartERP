import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Employee } from './entities/employee.entity';
import { Attendance } from './entities/attendance.entity';
import { Leave } from './entities/leave.entity';
import { EmploymentStatus } from './enums/employment-status.enum';
import { AttendanceStatus } from './enums/attendance-status.enum';
import { LeaveStatus } from './enums/leave-status.enum';
import { CacheService } from '@/common/cache/cache.service';
import { CacheTTL, generateCacheKey } from '@/common/cache/cache.config';
import { SecureRepository } from '@/common/security/secure-repository';
import { PermissionService, User } from '@/common/security/permission.service';

@Injectable()
export class ManagementService {
  private secureEmployeeRepo: SecureRepository<Employee>;
  private secureAttendanceRepo: SecureRepository<Attendance>;
  private secureLeaveRepo: SecureRepository<Leave>;

  constructor(
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    @InjectRepository(Attendance)
    private readonly attendanceRepository: Repository<Attendance>,
    @InjectRepository(Leave)
    private readonly leaveRepository: Repository<Leave>,
    private readonly cacheService: CacheService,
    private readonly permissionService: PermissionService,
  ) {
    this.secureEmployeeRepo = new SecureRepository(
      employeeRepository,
      permissionService,
      'Employee',
    );
    this.secureAttendanceRepo = new SecureRepository(
      attendanceRepository,
      permissionService,
      'Attendance',
    );
    this.secureLeaveRepo = new SecureRepository(leaveRepository, permissionService, 'Leave');
  }

  // ==================== EMPLOYEES ====================

  async findAllEmployees(user: User): Promise<Employee[]> {
    return this.secureEmployeeRepo.find(user, {
      order: { createdAt: 'DESC' },
    });
  }

  async findEmployeeById(user: User, id: string): Promise<Employee> {
    const cacheKey = generateCacheKey('employee', user.tenantId, id);
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const employee = await this.secureEmployeeRepo.findOne(user, {
          where: { id },
        });

        if (!employee) {
          throw new NotFoundException(`Employee with ID ${id} not found`);
        }

        return employee;
      },
      CacheTTL.MEDIUM,
    );
  }

  async findEmployeeByEmail(user: User, email: string): Promise<Employee | null> {
    return this.secureEmployeeRepo.findOne(user, {
      where: { email },
    });
  }

  async createEmployee(user: User, data: Partial<Employee>): Promise<Employee> {
    // Check email uniqueness
    const existingEmployee = await this.findEmployeeByEmail(user, data.email);
    if (existingEmployee) {
      throw new ConflictException(`Employee with email ${data.email} already exists`);
    }

    return this.secureEmployeeRepo.save(user, data);
  }

  async updateEmployee(user: User, id: string, data: Partial<Employee>): Promise<Employee> {
    const employee = await this.findEmployeeById(user, id);

    // Check email uniqueness if being updated
    if (data.email && data.email !== employee.email) {
      const existingEmployee = await this.findEmployeeByEmail(user, data.email);
      if (existingEmployee) {
        throw new ConflictException(`Employee with email ${data.email} already exists`);
      }
    }

    Object.assign(employee, data);
    const updated = await this.secureEmployeeRepo.save(user, employee);

    // Invalidate cache
    const cacheKey = generateCacheKey('employee', user.tenantId, id);
    await this.cacheService.del(cacheKey);

    return updated;
  }

  async deleteEmployee(user: User, id: string): Promise<void> {
    const employee = await this.findEmployeeById(user, id);
    await this.secureEmployeeRepo.remove(user, employee);

    // Invalidate cache
    const cacheKey = generateCacheKey('employee', user.tenantId, id);
    await this.cacheService.del(cacheKey);
  }

  async findEmployeesByDepartment(user: User, department: string): Promise<Employee[]> {
    return this.secureEmployeeRepo.find(user, {
      where: { department },
      order: { lastName: 'ASC' },
    });
  }

  async findEmployeesByStatus(user: User, status: EmploymentStatus): Promise<Employee[]> {
    return this.secureEmployeeRepo.find(user, {
      where: { status },
      order: { lastName: 'ASC' },
    });
  }

  async countEmployees(user: User): Promise<number> {
    const employees = await this.secureEmployeeRepo.find(user, {});
    return employees.length;
  }

  // ==================== ATTENDANCE ====================

  async findAllAttendance(
    user: User,
    employeeId?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<Attendance[]> {
    const where: Record<string, unknown> = {};
    if (employeeId) {
      where.employeeId = employeeId;
    }
    if (startDate && endDate) {
      where.date = Between(startDate, endDate);
    }

    return this.secureAttendanceRepo.find(user, {
      where: Object.keys(where).length > 0 ? where : undefined,
      order: { date: 'DESC' },
    });
  }

  async findAttendanceById(user: User, id: string): Promise<Attendance> {
    const cacheKey = generateCacheKey('attendance', user.tenantId, id);
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const attendance = await this.secureAttendanceRepo.findOne(user, {
          where: { id },
        });

        if (!attendance) {
          throw new NotFoundException(`Attendance record with ID ${id} not found`);
        }

        return attendance;
      },
      CacheTTL.MEDIUM,
    );
  }

  async createAttendance(user: User, data: Partial<Attendance>): Promise<Attendance> {
    // Verify employee exists
    await this.findEmployeeById(user, data.employeeId);

    return this.secureAttendanceRepo.save(user, data);
  }

  async updateAttendance(user: User, id: string, data: Partial<Attendance>): Promise<Attendance> {
    const attendance = await this.findAttendanceById(user, id);
    Object.assign(attendance, data);
    const updated = await this.secureAttendanceRepo.save(user, attendance);

    // Invalidate cache
    const cacheKey = generateCacheKey('attendance', user.tenantId, id);
    await this.cacheService.del(cacheKey);

    return updated;
  }

  async deleteAttendance(user: User, id: string): Promise<void> {
    const attendance = await this.findAttendanceById(user, id);
    await this.secureAttendanceRepo.remove(user, attendance);

    // Invalidate cache
    const cacheKey = generateCacheKey('attendance', user.tenantId, id);
    await this.cacheService.del(cacheKey);
  }

  async getAttendanceStatistics(
    user: User,
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
    const attendance = await this.findAllAttendance(user, employeeId, startDate, endDate);

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

  async findAllLeaves(user: User, employeeId?: string, status?: LeaveStatus): Promise<Leave[]> {
    const where: { employeeId?: string; status?: LeaveStatus } = {};
    if (employeeId) {
      where.employeeId = employeeId;
    }
    if (status) {
      where.status = status;
    }

    return this.secureLeaveRepo.find(user, {
      where: Object.keys(where).length > 0 ? where : undefined,
      order: { createdAt: 'DESC' },
    });
  }

  async findLeaveById(user: User, id: string): Promise<Leave> {
    const cacheKey = generateCacheKey('leave', user.tenantId, id);
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const leave = await this.secureLeaveRepo.findOne(user, {
          where: { id },
        });

        if (!leave) {
          throw new NotFoundException(`Leave request with ID ${id} not found`);
        }

        return leave;
      },
      CacheTTL.MEDIUM,
    );
  }

  async createLeave(user: User, data: Partial<Leave>): Promise<Leave> {
    // Verify employee exists
    await this.findEmployeeById(user, data.employeeId);

    // Calculate days if not provided
    if (!data.days && data.startDate && data.endDate) {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      data.days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }

    return this.secureLeaveRepo.save(user, data);
  }

  async updateLeave(user: User, id: string, data: Partial<Leave>): Promise<Leave> {
    const leave = await this.findLeaveById(user, id);
    Object.assign(leave, data);
    const updated = await this.secureLeaveRepo.save(user, leave);

    // Invalidate cache
    const cacheKey = generateCacheKey('leave', user.tenantId, id);
    await this.cacheService.del(cacheKey);

    return updated;
  }

  async deleteLeave(user: User, id: string): Promise<void> {
    const leave = await this.findLeaveById(user, id);
    await this.secureLeaveRepo.remove(user, leave);

    // Invalidate cache
    const cacheKey = generateCacheKey('leave', user.tenantId, id);
    await this.cacheService.del(cacheKey);
  }

  async approveLeave(user: User, id: string, approvedBy: string): Promise<Leave> {
    const leave = await this.findLeaveById(user, id);

    if (leave.status !== LeaveStatus.PENDING) {
      throw new BadRequestException('Only pending leaves can be approved');
    }

    leave.status = LeaveStatus.APPROVED;
    leave.approvedBy = approvedBy;
    leave.approvedAt = new Date();

    const updated = await this.secureLeaveRepo.save(user, leave);

    // Invalidate cache
    const cacheKey = generateCacheKey('leave', user.tenantId, id);
    await this.cacheService.del(cacheKey);

    return updated;
  }

  async rejectLeave(user: User, id: string): Promise<Leave> {
    const leave = await this.findLeaveById(user, id);

    if (leave.status !== LeaveStatus.PENDING) {
      throw new BadRequestException('Only pending leaves can be rejected');
    }

    leave.status = LeaveStatus.REJECTED;

    const updated = await this.secureLeaveRepo.save(user, leave);

    // Invalidate cache
    const cacheKey = generateCacheKey('leave', user.tenantId, id);
    await this.cacheService.del(cacheKey);

    return updated;
  }

  async getLeaveBalance(
    user: User,
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

    const leaves = await this.secureLeaveRepo.find(user, {
      where: {
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
