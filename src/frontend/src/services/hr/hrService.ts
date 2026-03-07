import api from '../api/apiService';

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
  async getAllEmployees(): Promise<Employee[]> {
    const response = await api.get('/hr/employees');
    return response.data;
  },

  async getEmployeeById(id: string): Promise<Employee> {
    const response = await api.get(`/hr/employees/${id}`);
    return response.data;
  },

  async createEmployee(data: CreateEmployeeDto): Promise<Employee> {
    const response = await api.post('/hr/employees', data);
    return response.data;
  },

  async updateEmployee(id: string, data: UpdateEmployeeDto): Promise<Employee> {
    const response = await api.put(`/hr/employees/${id}`, data);
    return response.data;
  },

  async deleteEmployee(id: string): Promise<void> {
    await api.delete(`/hr/employees/${id}`);
  },

  // Attendance Management
  async getAllAttendance(params?: AttendanceQueryParams): Promise<Attendance[]> {
    const response = await api.get('/hr/attendance', { params });
    return response.data;
  },

  async getAttendanceByEmployee(employeeId: string): Promise<Attendance[]> {
    const response = await api.get(`/hr/attendance/employee/${employeeId}`);
    return response.data;
  },

  async createAttendance(data: CreateAttendanceDto): Promise<Attendance> {
    const response = await api.post('/hr/attendance', data);
    return response.data;
  },

  async updateAttendance(id: string, data: UpdateAttendanceDto): Promise<Attendance> {
    const response = await api.put(`/hr/attendance/${id}`, data);
    return response.data;
  },

  // Leave Management
  async getAllLeaves(): Promise<Leave[]> {
    const response = await api.get('/hr/leaves');
    return response.data;
  },

  async getLeavesByEmployee(employeeId: string): Promise<Leave[]> {
    const response = await api.get(`/hr/leaves/employee/${employeeId}`);
    return response.data;
  },

  async createLeave(data: CreateLeaveDto): Promise<Leave> {
    const response = await api.post('/hr/leaves', data);
    return response.data;
  },

  async approveLeave(id: string, approvedBy: string): Promise<Leave> {
    const response = await api.post(`/hr/leaves/${id}/approve`, { approvedBy });
    return response.data;
  },

  async rejectLeave(id: string): Promise<Leave> {
    const response = await api.post(`/hr/leaves/${id}/reject`);
    return response.data;
  },
};

export default hrService;
