import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Attendance } from './entities/attendance.entity';
import { Employee } from '../employee/entities/employee.entity';
import { User as UserEntity } from '../user/entities/user.entity';
import { User } from '@/common/security/permission.service';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance)
    private readonly attendanceRepository: Repository<Attendance>,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
  ) {}

  /**
   * Check-in employee
   */
  async checkIn(
    employeeId: string,
    date: Date,
    checkInTime: string,
    user: User,
  ): Promise<Attendance> {
    // Validate employee exists
    const employee = await this.employeeRepository.findOne({
      where: { id: employeeId, tenantId: user.tenantId },
    });

    if (!employee) {
      throw new NotFoundException(`Employee ${employeeId} not found`);
    }

    // Check if already checked in today
    const existing = await this.attendanceRepository.findOne({
      where: {
        employeeId,
        date,
        tenantId: user.tenantId,
      },
    });

    if (existing) {
      throw new BadRequestException(
        `Employee already checked in on ${date.toISOString().split('T')[0]}`,
      );
    }

    // Create check-in record
    const attendance = this.attendanceRepository.create({
      employeeId,
      date,
      checkIn: checkInTime,
      tenantId: user.tenantId,
    });

    return this.attendanceRepository.save(attendance);
  }

  /**
   * Check-out employee
   */
  async checkOut(
    employeeId: string,
    date: Date,
    checkOutTime: string,
    user: User,
  ): Promise<Attendance> {
    // Find check-in record
    const attendance = await this.attendanceRepository.findOne({
      where: {
        employeeId,
        date,
        tenantId: user.tenantId,
      },
    });

    if (!attendance) {
      throw new NotFoundException(
        `No check-in record found for employee ${employeeId} on ${date.toISOString().split('T')[0]}`,
      );
    }

    if (attendance.checkOut) {
      throw new BadRequestException(
        `Employee already checked out at ${attendance.checkOut}`,
      );
    }

    // Update check-out time (hours will be auto-calculated by entity hook)
    attendance.checkOut = checkOutTime;
    return this.attendanceRepository.save(attendance);
  }

  /**
   * Get attendance records for an employee within date range
   */
  async getAttendanceByEmployee(
    employeeId: string,
    startDate: Date,
    endDate: Date,
    tenantId: string,
  ): Promise<Attendance[]> {
    return this.attendanceRepository.find({
      where: {
        employeeId,
        date: Between(startDate, endDate),
        tenantId,
      },
      order: { date: 'DESC' },
    });
  }

  /**
   * Get attendance report with statistics
   */
  async getAttendanceReport(
    employeeId: string,
    startDate: Date,
    endDate: Date,
    tenantId: string,
  ): Promise<{
    totalHours: number;
    totalDays: number;
    averageHours: number;
    attendances: Attendance[];
  }> {
    const attendances = await this.getAttendanceByEmployee(
      employeeId,
      startDate,
      endDate,
      tenantId,
    );

    const totalHours = attendances.reduce(
      (sum, att) => sum + Number(att.hoursWorked || 0),
      0,
    );
    const totalDays = attendances.length;
    const averageHours = totalDays > 0 ? Math.round((totalHours / totalDays) * 100) / 100 : 0;

    return {
      totalHours,
      totalDays,
      averageHours,
      attendances,
    };
  }
}
