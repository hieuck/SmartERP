import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Leave, LeaveType, LeaveStatus } from './entities/leave.entity';
import { LeaveBalance } from './entities/leave-balance.entity';
import { Employee } from '../employee/entities/employee.entity';
import { User as UserEntity } from '../user/entities/user.entity';
import { User } from '@/common/security/permission.service';

@Injectable()
export class LeaveService {
  constructor(
    @InjectRepository(Leave)
    private readonly leaveRepository: Repository<Leave>,
    @InjectRepository(LeaveBalance)
    private readonly leaveBalanceRepository: Repository<LeaveBalance>,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
  ) {}

  /**
   * Request leave
   */
  async requestLeave(
    employeeId: string,
    leaveType: LeaveType,
    startDate: Date,
    endDate: Date,
    reason: string,
    user: User,
  ): Promise<Leave> {
    // Validate employee exists
    const employee = await this.employeeRepository.findOne({
      where: { id: employeeId, tenantId: user.tenantId },
    });

    if (!employee) {
      throw new NotFoundException(`Employee ${employeeId} not found`);
    }

    // Calculate days (will be auto-calculated by entity, but we need it for validation)
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // Check leave balance (skip for unpaid leave)
    if (leaveType !== LeaveType.UNPAID) {
      const year = start.getFullYear();
      const balance = await this.getLeaveBalance(employeeId, leaveType, year, user.tenantId);

      if (balance.remaining < days) {
        throw new BadRequestException(
          `Insufficient leave balance. Required: ${days} days, Available: ${balance.remaining} days`,
        );
      }
    }

    // Create leave request
    const leave = this.leaveRepository.create({
      employeeId,
      leaveType,
      startDate,
      endDate,
      reason,
      status: LeaveStatus.PENDING,
      tenantId: user.tenantId,
    });

    return this.leaveRepository.save(leave);
  }

  /**
   * Approve leave request
   */
  async approveLeave(leaveId: string, user: User): Promise<Leave> {
    const leave = await this.leaveRepository.findOne({
      where: { id: leaveId, tenantId: user.tenantId },
    });

    if (!leave) {
      throw new NotFoundException(`Leave request ${leaveId} not found`);
    }

    if (leave.status !== LeaveStatus.PENDING) {
      throw new BadRequestException(
        `Leave request already processed with status: ${leave.status}`,
      );
    }

    // Update leave balance
    const year = new Date(leave.startDate).getFullYear();
    await this.leaveBalanceRepository.increment(
      {
        employeeId: leave.employeeId,
        leaveType: leave.leaveType,
        year,
        tenantId: user.tenantId,
      },
      'used',
      leave.days,
    );
    await this.leaveBalanceRepository.decrement(
      {
        employeeId: leave.employeeId,
        leaveType: leave.leaveType,
        year,
        tenantId: user.tenantId,
      },
      'remaining',
      leave.days,
    );

    // Approve leave
    leave.status = LeaveStatus.APPROVED;
    leave.approvedBy = user.id;
    leave.approvedAt = new Date();

    return this.leaveRepository.save(leave);
  }

  /**
   * Reject leave request
   */
  async rejectLeave(
    leaveId: string,
    rejectionReason: string,
    user: User,
  ): Promise<Leave> {
    const leave = await this.leaveRepository.findOne({
      where: { id: leaveId, tenantId: user.tenantId },
    });

    if (!leave) {
      throw new NotFoundException(`Leave request ${leaveId} not found`);
    }

    if (leave.status !== LeaveStatus.PENDING) {
      throw new BadRequestException(
        `Leave request already processed with status: ${leave.status}`,
      );
    }

    leave.status = LeaveStatus.REJECTED;
    leave.rejectionReason = rejectionReason;

    return this.leaveRepository.save(leave);
  }

  /**
   * Get leave balance for employee
   */
  async getLeaveBalance(
    employeeId: string,
    leaveType: LeaveType,
    year: number,
    tenantId: string,
  ): Promise<LeaveBalance> {
    let balance = await this.leaveBalanceRepository.findOne({
      where: {
        employeeId,
        leaveType,
        year,
        tenantId,
      },
    });

    // Create balance if not exists
    if (!balance) {
      balance = this.leaveBalanceRepository.create({
        employeeId,
        leaveType,
        year,
        allocated: 0,
        used: 0,
        remaining: 0,
        tenantId,
      });
      balance = await this.leaveBalanceRepository.save(balance);
    }

    return balance;
  }

  /**
   * Allocate leave days to employee
   */
  async allocateLeave(
    employeeId: string,
    leaveType: LeaveType,
    year: number,
    days: number,
    tenantId: string,
  ): Promise<LeaveBalance> {
    const balance = await this.getLeaveBalance(employeeId, leaveType, year, tenantId);

    balance.allocated += days;
    balance.remaining += days;

    return this.leaveBalanceRepository.save(balance);
  }

  /**
   * Get leave requests for employee
   */
  async getLeavesByEmployee(
    employeeId: string,
    startDate: Date,
    endDate: Date,
    tenantId: string,
  ): Promise<Leave[]> {
    return this.leaveRepository.find({
      where: {
        employeeId,
        startDate: Between(startDate, endDate),
        tenantId,
      },
      order: { startDate: 'DESC' },
    });
  }

  /**
   * Get pending leave requests (for managers)
   */
  async getPendingLeaves(tenantId: string): Promise<Leave[]> {
    return this.leaveRepository.find({
      where: {
        status: LeaveStatus.PENDING,
        tenantId,
      },
      relations: ['employee'],
      order: { createdAt: 'ASC' },
    });
  }
}
