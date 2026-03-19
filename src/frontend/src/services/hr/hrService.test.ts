import hrService, {
  AttendanceStatus,
  EmploymentStatus,
  EmploymentType,
  LeaveStatus,
  LeaveType,
  type CreateAttendanceDto,
  type CreateEmployeeDto,
  type CreateLeaveDto,
  type UpdateAttendanceDto,
  type UpdateEmployeeDto,
} from './hrService';
import api from './api';
import { vi } from 'vitest';

vi.mock('./api');

const mockApiGet = vi.mocked(api.get);
const mockApiPost = vi.mocked(api.post);
const mockApiPut = vi.mocked(api.put);
const mockApiDelete = vi.mocked(api.delete);

describe('hrService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('handles employee CRUD operations', async () => {
    const employees = [{ id: 'emp-1', firstName: 'Alice', status: EmploymentStatus.ACTIVE }];
    const employee = employees[0];
    const createPayload: CreateEmployeeDto = {
      firstName: 'Alice',
      lastName: 'Nguyen',
      email: 'alice@example.com',
      employmentType: EmploymentType.FULL_TIME,
    };
    const updatePayload: UpdateEmployeeDto = {
      department: 'Sales',
      status: EmploymentStatus.ON_LEAVE,
    };
    const created = { id: 'emp-2', ...createPayload };
    const updated = { id: 'emp-1', ...updatePayload };
    mockApiGet.mockResolvedValueOnce({ data: employees });
    mockApiGet.mockResolvedValueOnce({ data: employee });
    mockApiPost.mockResolvedValueOnce({ data: created });
    mockApiPut.mockResolvedValueOnce({ data: updated });
    mockApiDelete.mockResolvedValueOnce({ data: undefined });

    const listResult = await hrService.getAllEmployees();
    const singleResult = await hrService.getEmployeeById('emp-1');
    const createResult = await hrService.createEmployee(createPayload);
    const updateResult = await hrService.updateEmployee('emp-1', updatePayload);
    await hrService.deleteEmployee('emp-1');

    expect(api.get).toHaveBeenNthCalledWith(1, '/hr/employees');
    expect(api.get).toHaveBeenNthCalledWith(2, '/hr/employees/emp-1');
    expect(api.post).toHaveBeenCalledWith('/hr/employees', createPayload);
    expect(api.put).toHaveBeenCalledWith('/hr/employees/emp-1', updatePayload);
    expect(api.delete).toHaveBeenCalledWith('/hr/employees/emp-1');
    expect(listResult).toEqual(employees);
    expect(singleResult).toEqual(employee);
    expect(createResult).toEqual(created);
    expect(updateResult).toEqual(updated);
  });

  it('handles attendance operations', async () => {
    const attendance = [{ id: 'att-1', employeeId: 'emp-1', status: AttendanceStatus.PRESENT }];
    const employeeAttendance = attendance;
    const createPayload: CreateAttendanceDto = {
      employeeId: 'emp-1',
      date: new Date('2026-03-19'),
      checkIn: '08:00',
      status: AttendanceStatus.PRESENT,
    };
    const updatePayload: UpdateAttendanceDto = {
      checkOut: '17:00',
      status: AttendanceStatus.PRESENT,
    };
    const created = { id: 'att-2', ...createPayload };
    const updated = { id: 'att-1', ...updatePayload };
    mockApiGet.mockResolvedValueOnce({ data: attendance });
    mockApiGet.mockResolvedValueOnce({ data: employeeAttendance });
    mockApiPost.mockResolvedValueOnce({ data: created });
    mockApiPut.mockResolvedValueOnce({ data: updated });

    const listResult = await hrService.getAllAttendance({
      startDate: '2026-03-01',
      endDate: '2026-03-31',
    });
    const employeeResult = await hrService.getAttendanceByEmployee('emp-1');
    const createResult = await hrService.createAttendance(createPayload);
    const updateResult = await hrService.updateAttendance('att-1', updatePayload);

    expect(api.get).toHaveBeenNthCalledWith(1, '/hr/attendance', {
      params: { startDate: '2026-03-01', endDate: '2026-03-31' },
    });
    expect(api.get).toHaveBeenNthCalledWith(2, '/hr/attendance/employee/emp-1');
    expect(api.post).toHaveBeenCalledWith('/hr/attendance', createPayload);
    expect(api.put).toHaveBeenCalledWith('/hr/attendance/att-1', updatePayload);
    expect(listResult).toEqual(attendance);
    expect(employeeResult).toEqual(employeeAttendance);
    expect(createResult).toEqual(created);
    expect(updateResult).toEqual(updated);
  });

  it('handles leave operations', async () => {
    const leaves = [{ id: 'leave-1', employeeId: 'emp-1', status: LeaveStatus.PENDING }];
    const employeeLeaves = leaves;
    const createPayload: CreateLeaveDto = {
      employeeId: 'emp-1',
      type: LeaveType.ANNUAL,
      startDate: new Date('2026-03-20'),
      endDate: new Date('2026-03-21'),
      days: 2,
      reason: 'Family trip',
    };
    const created = { id: 'leave-2', ...createPayload };
    const approved = { id: 'leave-1', status: LeaveStatus.APPROVED };
    const rejected = { id: 'leave-3', status: LeaveStatus.REJECTED };
    mockApiGet.mockResolvedValueOnce({ data: leaves });
    mockApiGet.mockResolvedValueOnce({ data: employeeLeaves });
    mockApiPost.mockResolvedValueOnce({ data: created });
    mockApiPost.mockResolvedValueOnce({ data: approved });
    mockApiPost.mockResolvedValueOnce({ data: rejected });

    const listResult = await hrService.getAllLeaves();
    const employeeResult = await hrService.getLeavesByEmployee('emp-1');
    const createResult = await hrService.createLeave(createPayload);
    const approveResult = await hrService.approveLeave('leave-1', 'manager-1');
    const rejectResult = await hrService.rejectLeave('leave-3');

    expect(api.get).toHaveBeenNthCalledWith(1, '/hr/leaves');
    expect(api.get).toHaveBeenNthCalledWith(2, '/hr/leaves/employee/emp-1');
    expect(api.post).toHaveBeenNthCalledWith(1, '/hr/leaves', createPayload);
    expect(api.post).toHaveBeenNthCalledWith(2, '/hr/leaves/leave-1/approve', {
      approvedBy: 'manager-1',
    });
    expect(api.post).toHaveBeenNthCalledWith(3, '/hr/leaves/leave-3/reject');
    expect(listResult).toEqual(leaves);
    expect(employeeResult).toEqual(employeeLeaves);
    expect(createResult).toEqual(created);
    expect(approveResult).toEqual(approved);
    expect(rejectResult).toEqual(rejected);
  });

  it('wraps employee fetch errors with a helpful message', async () => {
    mockApiGet.mockRejectedValueOnce(new Error('network down'));

    await expect(hrService.getEmployeeById('emp-404')).rejects.toThrow(
      'Failed to fetch employee emp-404: network down',
    );
  });
});
