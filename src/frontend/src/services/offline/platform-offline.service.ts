import { db, Document, Report, Workflow, Settings } from '@/lib/offline/db';
import { BaseOfflineService } from './base-offline.service';

/**
 * Document offline service
 */
export class DocumentOfflineService extends BaseOfflineService<Document> {
  constructor() {
    super(db.documents, 'documents');
  }

  async getByDocumentNumber(documentNumber: string): Promise<Document | undefined> {
    return db.documents.where('documentNumber').equals(documentNumber).first();
  }

  async getByType(documentType: string): Promise<Document[]> {
    return db.documents.where('documentType').equals(documentType).toArray();
  }

  async getByRelatedEntity(relatedEntity: string, relatedEntityId: string): Promise<Document[]> {
    return db.documents
      .where(['relatedEntity', 'relatedEntityId'])
      .equals([relatedEntity, relatedEntityId])
      .toArray();
  }

  async getByStatus(status: string): Promise<Document[]> {
    return db.documents.where('status').equals(status).toArray();
  }
}

/**
 * Report offline service
 */
export class ReportOfflineService extends BaseOfflineService<Report> {
  constructor() {
    super(db.reports, 'reports');
  }

  async getByReportCode(reportCode: string): Promise<Report | undefined> {
    return db.reports.where('reportCode').equals(reportCode).first();
  }

  async getByType(reportType: string): Promise<Report[]> {
    return db.reports.where('reportType').equals(reportType).toArray();
  }

  async getActive(): Promise<Report[]> {
    return db.reports.where('isActive').equals(1).toArray();
  }
}

/**
 * Workflow offline service
 */
export class WorkflowOfflineService extends BaseOfflineService<Workflow> {
  constructor() {
    super(db.workflows, 'workflows');
  }

  async getByWorkflowCode(workflowCode: string): Promise<Workflow | undefined> {
    return db.workflows.where('workflowCode').equals(workflowCode).first();
  }

  async getByEntityType(entityType: string): Promise<Workflow[]> {
    return db.workflows.where('entityType').equals(entityType).toArray();
  }

  async getActive(): Promise<Workflow[]> {
    return db.workflows.where('isActive').equals(1).toArray();
  }
}

/**
 * Settings offline service
 */
export class SettingsOfflineService extends BaseOfflineService<Settings> {
  constructor() {
    super(db.settings, 'settings');
  }

  async getByKey(settingKey: string): Promise<Settings | undefined> {
    return db.settings.where('settingKey').equals(settingKey).first();
  }

  async getByCategory(category: string): Promise<Settings[]> {
    return db.settings.where('category').equals(category).toArray();
  }

  async getPublic(): Promise<Settings[]> {
    const all = await db.settings.toArray();
    return all.filter(setting => setting.isPublic);
  }

  async getValue(settingKey: string): Promise<any> {
    const setting = await this.getByKey(settingKey);
    if (!setting) return null;

    switch (setting.settingType) {
      case 'number':
        return Number(setting.settingValue);
      case 'boolean':
        return setting.settingValue === 'true';
      case 'json':
        return JSON.parse(setting.settingValue);
      default:
        return setting.settingValue;
    }
  }
}

// Export singleton instances
export const documentOfflineService = new DocumentOfflineService();
export const reportOfflineService = new ReportOfflineService();
export const workflowOfflineService = new WorkflowOfflineService();
export const settingsOfflineService = new SettingsOfflineService();
