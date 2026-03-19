import { beforeEach, describe, expect, it, vi } from 'vitest';

const makeEqualsChain = <T>(result: T) => ({
  equals: vi.fn(() => ({
    first: vi.fn(async () => (Array.isArray(result) ? result[0] : result)),
    toArray: vi.fn(async () => (Array.isArray(result) ? result : [result])),
  })),
  anyOf: vi.fn(() => ({
    toArray: vi.fn(async () => (Array.isArray(result) ? result : [result])),
  })),
  between: vi.fn(() => ({
    toArray: vi.fn(async () => (Array.isArray(result) ? result : [result])),
  })),
});

const projectsWhere = vi.fn();
const projectsToArray = vi.fn();
const tasksWhere = vi.fn();
const tasksToArray = vi.fn();
const timeEntriesWhere = vi.fn();
const timeEntriesToArray = vi.fn();

vi.mock('@/lib/offline/db', () => ({
  db: {
    projects: {
      where: projectsWhere,
      toArray: projectsToArray,
    },
    tasks: {
      where: tasksWhere,
      toArray: tasksToArray,
    },
    timeEntries: {
      where: timeEntriesWhere,
      toArray: timeEntriesToArray,
    },
  },
}));

vi.mock('./base-offline.service', () => ({
  BaseOfflineService: class {
    constructor(_table: unknown, _endpoint: string) {}
  },
}));

describe('project offline services', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('queries projects and filters active, by manager, and over-budget sets', async () => {
    const project = { id: 'proj-1', projectCode: 'PRJ-001' };
    const projects = [project];
    projectsWhere
      .mockReturnValueOnce(makeEqualsChain(project))
      .mockReturnValueOnce(makeEqualsChain(projects))
      .mockReturnValueOnce(makeEqualsChain(projects))
      .mockReturnValueOnce(makeEqualsChain(projects));
    projectsToArray
      .mockResolvedValueOnce([
        { id: 'proj-1', managerId: 'mgr-1' },
        { id: 'proj-2', managerId: 'mgr-2' },
      ])
      .mockResolvedValueOnce([
        { id: 'proj-1', budget: 100, actualCost: 120 },
        { id: 'proj-2', budget: 100, actualCost: 80 },
      ]);

    const { projectOfflineService } = await import('./project-offline.service');

    const byCode = await projectOfflineService.getByProjectCode('PRJ-001');
    const byCustomer = await projectOfflineService.getByCustomer('cus-1');
    const byStatus = await projectOfflineService.getByStatus('planning');
    const byManager = await projectOfflineService.getByManager('mgr-1');
    const active = await projectOfflineService.getActive();
    const overBudget = await projectOfflineService.getOverBudget();

    expect(projectsWhere).toHaveBeenNthCalledWith(1, 'projectCode');
    expect(projectsWhere).toHaveBeenNthCalledWith(2, 'customerId');
    expect(projectsWhere).toHaveBeenNthCalledWith(3, 'status');
    expect(projectsWhere).toHaveBeenNthCalledWith(4, 'status');
    expect(byCode).toEqual(project);
    expect(byCustomer).toEqual(projects);
    expect(byStatus).toEqual(projects);
    expect(byManager).toEqual([{ id: 'proj-1', managerId: 'mgr-1' }]);
    expect(active).toEqual(projects);
    expect(overBudget).toEqual([{ id: 'proj-1', budget: 100, actualCost: 120 }]);
  });

  it('queries tasks and filters overdue and subtask collections', async () => {
    const task = { id: 'task-1', taskNumber: 'TASK-001' };
    const tasks = [task];
    const pastDate = new Date(Date.now() - 86400000).toISOString();
    tasksWhere
      .mockReturnValueOnce(makeEqualsChain(task))
      .mockReturnValueOnce(makeEqualsChain(tasks))
      .mockReturnValueOnce(makeEqualsChain(tasks))
      .mockReturnValueOnce(makeEqualsChain(tasks))
      .mockReturnValueOnce(makeEqualsChain(tasks));
    tasksToArray
      .mockResolvedValueOnce([
        { id: 'task-1', dueDate: pastDate, status: 'in_progress' },
        { id: 'task-2', dueDate: pastDate, status: 'completed' },
      ])
      .mockResolvedValueOnce([
        { id: 'task-3', parentTaskId: 'task-1' },
        { id: 'task-4', parentTaskId: 'task-2' },
      ]);

    const { taskOfflineService } = await import('./project-offline.service');

    const byNumber = await taskOfflineService.getByTaskNumber('TASK-001');
    const byProject = await taskOfflineService.getByProject('proj-1');
    const byAssignee = await taskOfflineService.getByAssignee('user-1');
    const byStatus = await taskOfflineService.getByStatus('open');
    const byPriority = await taskOfflineService.getByPriority('high');
    const overdue = await taskOfflineService.getOverdue();
    const subtasks = await taskOfflineService.getSubTasks('task-1');

    expect(tasksWhere).toHaveBeenNthCalledWith(1, 'taskNumber');
    expect(tasksWhere).toHaveBeenNthCalledWith(2, 'projectId');
    expect(tasksWhere).toHaveBeenNthCalledWith(3, 'assignedTo');
    expect(tasksWhere).toHaveBeenNthCalledWith(4, 'status');
    expect(tasksWhere).toHaveBeenNthCalledWith(5, 'priority');
    expect(byNumber).toEqual(task);
    expect(byProject).toEqual(tasks);
    expect(byAssignee).toEqual(tasks);
    expect(byStatus).toEqual(tasks);
    expect(byPriority).toEqual(tasks);
    expect(overdue).toEqual([{ id: 'task-1', dueDate: pastDate, status: 'in_progress' }]);
    expect(subtasks).toEqual([{ id: 'task-3', parentTaskId: 'task-1' }]);
  });

  it('queries time entries by dimensions, date range, and billable filter', async () => {
    const entries = [{ id: 'time-1', employeeId: 'emp-1', status: 'approved' }];
    timeEntriesWhere
      .mockReturnValueOnce(makeEqualsChain(entries))
      .mockReturnValueOnce(makeEqualsChain(entries))
      .mockReturnValueOnce(makeEqualsChain(entries))
      .mockReturnValueOnce(makeEqualsChain(entries))
      .mockReturnValueOnce(makeEqualsChain(entries));
    timeEntriesToArray.mockResolvedValue([
      { id: 'time-1', billable: true, status: 'approved' },
      { id: 'time-2', billable: false, status: 'approved' },
    ]);

    const { timeEntryOfflineService } = await import('./project-offline.service');

    const byEmployee = await timeEntryOfflineService.getByEmployee('emp-1');
    const byProject = await timeEntryOfflineService.getByProject('proj-1');
    const byTask = await timeEntryOfflineService.getByTask('task-1');
    const byStatus = await timeEntryOfflineService.getByStatus('approved');
    const byDate = await timeEntryOfflineService.getByDateRange(
      new Date('2026-03-01'),
      new Date('2026-03-31'),
    );
    const billable = await timeEntryOfflineService.getBillable();

    expect(timeEntriesWhere).toHaveBeenNthCalledWith(1, 'employeeId');
    expect(timeEntriesWhere).toHaveBeenNthCalledWith(2, 'projectId');
    expect(timeEntriesWhere).toHaveBeenNthCalledWith(3, 'taskId');
    expect(timeEntriesWhere).toHaveBeenNthCalledWith(4, 'status');
    expect(timeEntriesWhere).toHaveBeenNthCalledWith(5, 'entryDate');
    expect(byEmployee).toEqual(entries);
    expect(byProject).toEqual(entries);
    expect(byTask).toEqual(entries);
    expect(byStatus).toEqual(entries);
    expect(byDate).toEqual(entries);
    expect(billable).toEqual([{ id: 'time-1', billable: true, status: 'approved' }]);
  });
});
