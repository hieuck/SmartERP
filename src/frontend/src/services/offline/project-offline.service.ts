import { db, Project, Task, TimeEntry } from '@/lib/offline/db';
import { BaseOfflineService } from './base-offline.service';

/**
 * Project offline service
 */
export class ProjectOfflineService extends BaseOfflineService<Project> {
  constructor() {
    super(db.projects, 'projects');
  }

  async getByProjectCode(projectCode: string): Promise<Project | undefined> {
    return db.projects.where('projectCode').equals(projectCode).first();
  }

  async getByCustomer(customerId: string): Promise<Project[]> {
    return db.projects.where('customerId').equals(customerId).toArray();
  }

  async getByStatus(status: string): Promise<Project[]> {
    return db.projects.where('status').equals(status).toArray();
  }

  async getByManager(managerId: string): Promise<Project[]> {
    const all = await db.projects.toArray();
    return all.filter(project => project.managerId === managerId);
  }

  async getActive(): Promise<Project[]> {
    return db.projects
      .where('status')
      .anyOf(['planning', 'in_progress'])
      .toArray();
  }

  async getOverBudget(): Promise<Project[]> {
    const all = await db.projects.toArray();
    return all.filter(project => 
      project.budget && 
      project.actualCost && 
      project.actualCost > project.budget
    );
  }
}

/**
 * Task offline service
 */
export class TaskOfflineService extends BaseOfflineService<Task> {
  constructor() {
    super(db.tasks, 'tasks');
  }

  async getByTaskNumber(taskNumber: string): Promise<Task | undefined> {
    return db.tasks.where('taskNumber').equals(taskNumber).first();
  }

  async getByProject(projectId: string): Promise<Task[]> {
    return db.tasks.where('projectId').equals(projectId).toArray();
  }

  async getByAssignee(assignedTo: string): Promise<Task[]> {
    return db.tasks.where('assignedTo').equals(assignedTo).toArray();
  }

  async getByStatus(status: string): Promise<Task[]> {
    return db.tasks.where('status').equals(status).toArray();
  }

  async getByPriority(priority: string): Promise<Task[]> {
    return db.tasks.where('priority').equals(priority).toArray();
  }

  async getOverdue(): Promise<Task[]> {
    const now = new Date();
    const all = await db.tasks.toArray();
    return all.filter(task => 
      task.dueDate && 
      new Date(task.dueDate) < now && 
      task.status !== 'completed' &&
      task.status !== 'cancelled'
    );
  }

  async getSubTasks(parentTaskId: string): Promise<Task[]> {
    const all = await db.tasks.toArray();
    return all.filter(task => task.parentTaskId === parentTaskId);
  }
}

/**
 * Time Entry offline service
 */
export class TimeEntryOfflineService extends BaseOfflineService<TimeEntry> {
  constructor() {
    super(db.timeEntries, 'timeEntries');
  }

  async getByEmployee(employeeId: string): Promise<TimeEntry[]> {
    return db.timeEntries.where('employeeId').equals(employeeId).toArray();
  }

  async getByProject(projectId: string): Promise<TimeEntry[]> {
    return db.timeEntries.where('projectId').equals(projectId).toArray();
  }

  async getByTask(taskId: string): Promise<TimeEntry[]> {
    return db.timeEntries.where('taskId').equals(taskId).toArray();
  }

  async getByStatus(status: string): Promise<TimeEntry[]> {
    return db.timeEntries.where('status').equals(status).toArray();
  }

  async getByDateRange(startDate: Date, endDate: Date): Promise<TimeEntry[]> {
    return db.timeEntries
      .where('entryDate')
      .between(startDate, endDate, true, true)
      .toArray();
  }

  async getBillable(): Promise<TimeEntry[]> {
    const all = await db.timeEntries.toArray();
    return all.filter(entry => entry.billable && entry.status === 'approved');
  }
}

// Export singleton instances
export const projectOfflineService = new ProjectOfflineService();
export const taskOfflineService = new TaskOfflineService();
export const timeEntryOfflineService = new TimeEntryOfflineService();
