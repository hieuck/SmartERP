import api from './api';

// Enums
export enum EmploymentStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ON_LEAVE = 'on_leave',
  TERMINATED = 'terminated',
}

export enum EmploymentType {
  FULL_TIME = 'full_time',
  PART_TIME = 'part_time',
  CONTRACT = 'contract',
  INTERN = 'intern',
}

export enum AttendanceStatus {
  PRESENT = 'present',
  ABSENT = 'absent',
  LATE = 'late',
  HALF_DAY = 'half_day',
}

export enum LeaveType {
  ANNUAL = 'annual',
  SICK = 'sick',
  UNPAID = 'unpaid',
  MATERNITY = 'maternity',
  PATERNITY = 'paternity',
  OTHER = 'other',
}

export enum LeaveStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

// Interfaces
export interface Employee {
  id: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  employeeCode?: string;
  department?: string;
  position?: string;
  status: EmploymentStatus;
  employmentType: EmploymentType;
  hireDate?: Date;
  salary?: number;
  managerId?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface Attendance {
  id: string;
  tenantId: string;
  employeeId: string;
  date: Date;
  checkIn?: string;
  checkOut?: string;
  status: AttendanceStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Leave {
  id: string;
  tenantId: string;
  employeeId: string;
  type: LeaveType;
  startDate: Date;
  endDate: Date;
  days: number;
  status: LeaveStatus;
  reason?: string;
  approvedBy?: string;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateEmployeeDto {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  employeeCode?: string;
  department?: string;
  position?: string;
  status?: EmploymentStatus;
  employmentType?: EmploymentType;
  hireDate?: Date;
  salary?: number;
  managerId?: string;
}

export interface UpdateEmployeeDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  employeeCode?: string;
  department?: string;
  position?: string;
  status?: EmploymentStatus;
  employmentType?: EmploymentType;
  hireDate?: Date;
  salary?: number;
  managerId?: string;
}

export interface CreateAttendanceDto {
  employeeId: string;
  date: Date;
  checkIn?: string;
  checkOut?: string;
  status?: AttendanceStatus;
  notes?: string;
}

export interface UpdateAttendanceDto {
  checkIn?: string;
  checkOut?: string;
  status?: AttendanceStatus;
  notes?: string;
}

export interface CreateLeaveDto {
  employeeId: string;
  type: LeaveType;
  startDate: Date;
  endDate: Date;
  days: number;
  reason?: string;
}

export interface AttendanceQueryParams {
  startDate?: string;
  endDate?: string;
}

// HR Service
const hrService = {
  // Employee Management

  /**
   * Retrieves all employees
   * @returns Promise<Employee[]> List of all employees
   * @throws Error if API call fails
   */
  async getAllEmployees(): Promise<Employee[]> {
    try {
      const response = await api.get('/hr/employees');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch employees: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  /**
   * Retrieves a specific employee by ID
   * @param id - Employee ID
   * @returns Promise<Employee> Employee data
   * @throws Error if employee not found or API call fails
   */
  async getEmployeeById(id: string): Promise<Employee> {
    try {
      const response = await api.get(`/hr/employees/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch employee ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  /**
   * Creates a new employee
   * @param data - Employee creation data
   * @returns Promise<Employee> Created employee
   * @throws Error if creation fails
   */
  async createEmployee(data: CreateEmployeeDto): Promise<Employee> {
    try {
      const response = await api.post('/hr/employees', data);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create employee: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  /**
   * Updates an existing employee
   * @param id - Employee ID
   * @param data - Employee update data
   * @returns Promise<Employee> Updated employee
   * @throws Error if update fails
   */
  async updateEmployee(id: string, data: UpdateEmployeeDto): Promise<Employee> {
    try {
      const response = await api.put(`/hr/employees/${id}`, data);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to update employee ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  /**
   * Deletes an employee
   * @param id - Employee ID
   * @throws Error if deletion fails
   */
  async deleteEmployee(id: string): Promise<void> {
    try {
      await api.delete(`/hr/employees/${id}`);
    } catch (error) {
      throw new Error(`Failed to delete employee ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  // Attendance Management

  /**
   * Retrieves all attendance records
   * @param params - Query parameters (startDate, endDate)
   * @returns Promise<Attendance[]> List of attendance records
   * @throws Error if API call fails
   */
  async getAllAttendance(params?: AttendanceQueryParams): Promise<Attendance[]> {
    try {
      const response = await api.get('/hr/attendance', { params });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch attendance records: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  /**
   * Retrieves attendance records for a specific employee
   * @param employeeId - Employee ID
   * @returns Promise<Attendance[]> List of attendance records
   * @throws Error if API call fails
   */
  async getAttendanceByEmployee(employeeId: string): Promise<Attendance[]> {
    try {
      const response = await api.get(`/hr/attendance/employee/${employeeId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch attendance for employee ${employeeId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  /**
   * Creates a new attendance record
   * @param data - Attendance creation data
   * @returns Promise<Attendance> Created attendance record
   * @throws Error if creation fails
   */
  async createAttendance(data: CreateAttendanceDto): Promise<Attendance> {
    try {
      const response = await api.post('/hr/attendance', data);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create attendance record: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  /**
   * Updates an attendance record
   * @param id - Attendance record ID
   * @param data - Attendance update data
   * @returns Promise<Attendance> Updated attendance record
   * @throws Error if update fails
   */
  async updateAttendance(id: string, data: UpdateAttendanceDto): Promise<Attendance> {
    try {
      const response = await api.put(`/hr/attendance/${id}`, data);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to update attendance record ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  // Leave Management

  /**
   * Retrieves all leave requests
   * @returns Promise<Leave[]> List of leave requests
   * @throws Error if API call fails
   */
  async getAllLeaves(): Promise<Leave[]> {
    try {
      const response = await api.get('/hr/leaves');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch leave requests: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  /**
   * Retrieves leave requests for a specific employee
   * @param employeeId - Employee ID
   * @returns Promise<Leave[]> List of leave requests
   * @throws Error if API call fails
   */
  async getLeavesByEmployee(employeeId: string): Promise<Leave[]> {
    try {
      const response = await api.get(`/hr/leaves/employee/${employeeId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch leaves for employee ${employeeId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  /**
   * Creates a new leave request
   * @param data - Leave creation data
   * @returns Promise<Leave> Created leave request
   * @throws Error if creation fails
   */
  async createLeave(data: CreateLeaveDto): Promise<Leave> {
    try {
      const response = await api.post('/hr/leaves', data);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create leave request: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  /**
   * Approves a leave request
   * @param id - Leave request ID
   * @param approvedBy - ID of approver
   * @returns Promise<Leave> Updated leave request
   * @throws Error if approval fails
   */
  async approveLeave(id: string, approvedBy: string): Promise<Leave> {
    try {
      const response = await api.post(`/hr/leaves/${id}/approve`, { approvedBy });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to approve leave ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  /**
   * Rejects a leave request
   * @param id - Leave request ID
   * @returns Promise<Leave> Updated leave request
   * @throws Error if rejection fails
   */
  async rejectLeave(id: string): Promise<Leave> {
    try {
      const response = await api.post(`/hr/leaves/${id}/reject`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to reject leave ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
};

export default hrService;
