import { beforeEach, describe, expect, it, vi } from 'vitest';

const makeEqualsChain = <T>(result: T) => ({
  equals: vi.fn(() => ({
    first: vi.fn(async () => (Array.isArray(result) ? result[0] : result)),
    toArray: vi.fn(async () => (Array.isArray(result) ? result : [result])),
  })),
});

const documentsWhere = vi.fn();
const reportsWhere = vi.fn();
const workflowsWhere = vi.fn();
const settingsWhere = vi.fn();
const settingsToArray = vi.fn();

vi.mock('@/lib/offline/db', () => ({
  db: {
    documents: { where: documentsWhere },
    reports: { where: reportsWhere },
    workflows: { where: workflowsWhere },
    settings: { where: settingsWhere, toArray: settingsToArray },
  },
}));

vi.mock('./base-offline.service', () => ({
  BaseOfflineService: class {
    constructor(_table: unknown, _endpoint: string) {}
  },
}));

describe('platform offline services', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('queries document offline service by number, type, related entity, and status', async () => {
    const document = { id: 'doc-1', documentNumber: 'DOC-001' };
    const documents = [document];
    documentsWhere
      .mockReturnValueOnce(makeEqualsChain(document))
      .mockReturnValueOnce(makeEqualsChain(documents))
      .mockReturnValueOnce(makeEqualsChain(documents))
      .mockReturnValueOnce(makeEqualsChain(documents));

    const { documentOfflineService } = await import('./platform-offline.service');

    const byNumber = await documentOfflineService.getByDocumentNumber('DOC-001');
    const byType = await documentOfflineService.getByType('invoice');
    const byRelated = await documentOfflineService.getByRelatedEntity('invoice', 'inv-1');
    const byStatus = await documentOfflineService.getByStatus('draft');

    expect(documentsWhere).toHaveBeenNthCalledWith(1, 'documentNumber');
    expect(documentsWhere).toHaveBeenNthCalledWith(2, 'documentType');
    expect(documentsWhere).toHaveBeenNthCalledWith(3, ['relatedEntity', 'relatedEntityId']);
    expect(documentsWhere).toHaveBeenNthCalledWith(4, 'status');
    expect(byNumber).toEqual(document);
    expect(byType).toEqual(documents);
    expect(byRelated).toEqual(documents);
    expect(byStatus).toEqual(documents);
  });

  it('queries report and workflow offline services and filters active records', async () => {
    const report = { id: 'rep-1', reportCode: 'R-001' };
    const reports = [report];
    const workflow = { id: 'wf-1', workflowCode: 'WF-001' };
    const workflows = [workflow];
    reportsWhere
      .mockReturnValueOnce(makeEqualsChain(report))
      .mockReturnValueOnce(makeEqualsChain(reports))
      .mockReturnValueOnce(makeEqualsChain(reports));
    workflowsWhere
      .mockReturnValueOnce(makeEqualsChain(workflow))
      .mockReturnValueOnce(makeEqualsChain(workflows))
      .mockReturnValueOnce(makeEqualsChain(workflows));

    const { reportOfflineService, workflowOfflineService } = await import('./platform-offline.service');

    const reportByCode = await reportOfflineService.getByReportCode('R-001');
    const reportByType = await reportOfflineService.getByType('sales');
    const activeReports = await reportOfflineService.getActive();
    const workflowByCode = await workflowOfflineService.getByWorkflowCode('WF-001');
    const workflowByEntity = await workflowOfflineService.getByEntityType('invoice');
    const activeWorkflows = await workflowOfflineService.getActive();

    expect(reportsWhere).toHaveBeenNthCalledWith(1, 'reportCode');
    expect(reportsWhere).toHaveBeenNthCalledWith(2, 'reportType');
    expect(reportsWhere).toHaveBeenNthCalledWith(3, 'isActive');
    expect(workflowsWhere).toHaveBeenNthCalledWith(1, 'workflowCode');
    expect(workflowsWhere).toHaveBeenNthCalledWith(2, 'entityType');
    expect(workflowsWhere).toHaveBeenNthCalledWith(3, 'isActive');
    expect(reportByCode).toEqual(report);
    expect(reportByType).toEqual(reports);
    expect(activeReports).toEqual(reports);
    expect(workflowByCode).toEqual(workflow);
    expect(workflowByEntity).toEqual(workflows);
    expect(activeWorkflows).toEqual(workflows);
  });

  it('queries settings offline service and parses typed values', async () => {
    const publicSettings = [
      { settingKey: 'app.name', isPublic: true, settingType: 'string', settingValue: 'SmartERP' },
      { settingKey: 'feature.enabled', isPublic: false, settingType: 'boolean', settingValue: 'false' },
    ];
    settingsWhere
      .mockReturnValueOnce(makeEqualsChain({ settingKey: 'app.name', settingValue: 'SmartERP' }))
      .mockReturnValueOnce(makeEqualsChain([{ settingKey: 'category.general' }]))
      .mockReturnValueOnce(
        makeEqualsChain({
          settingKey: 'tax.rate',
          settingType: 'number',
          settingValue: '10',
        }),
      )
      .mockReturnValueOnce(
        makeEqualsChain({
          settingKey: 'feature.enabled',
          settingType: 'boolean',
          settingValue: 'true',
        }),
      )
      .mockReturnValueOnce(
        makeEqualsChain({
          settingKey: 'theme.config',
          settingType: 'json',
          settingValue: '{"mode":"light"}',
        }),
      )
      .mockReturnValueOnce(makeEqualsChain(undefined));
    settingsToArray.mockResolvedValue(publicSettings);

    const { settingsOfflineService } = await import('./platform-offline.service');

    const byKey = await settingsOfflineService.getByKey('app.name');
    const byCategory = await settingsOfflineService.getByCategory('GENERAL');
    const publicResult = await settingsOfflineService.getPublic();
    const numberValue = await settingsOfflineService.getValue('tax.rate');
    const booleanValue = await settingsOfflineService.getValue('feature.enabled');
    const jsonValue = await settingsOfflineService.getValue('theme.config');
    const missingValue = await settingsOfflineService.getValue('missing');

    expect(settingsWhere).toHaveBeenNthCalledWith(1, 'settingKey');
    expect(settingsWhere).toHaveBeenNthCalledWith(2, 'category');
    expect(byKey).toEqual({ settingKey: 'app.name', settingValue: 'SmartERP' });
    expect(byCategory).toEqual([{ settingKey: 'category.general' }]);
    expect(publicResult).toEqual([publicSettings[0]]);
    expect(numberValue).toBe(10);
    expect(booleanValue).toBe(true);
    expect(jsonValue).toEqual({ mode: 'light' });
    expect(missingValue).toBeNull();
  });
});
