import emailService, {
  EmailStatus,
  TemplateType,
  type CreateEmailTemplateDto,
  type SendEmailDto,
  type SendTemplateEmailDto,
  type UpdateEmailTemplateDto,
} from './emailService';
import api from './api';
import { vi } from 'vitest';

vi.mock('./api');

const mockApiGet = vi.mocked(api.get);
const mockApiPost = vi.mocked(api.post);
const mockApiPut = vi.mocked(api.put);
const mockApiDelete = vi.mocked(api.delete);

describe('emailService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('manages email templates', async () => {
    const templates = [{ id: 'tpl-1', name: 'Welcome', type: TemplateType.WELCOME }];
    const template = { id: 'tpl-1', name: 'Welcome', type: TemplateType.WELCOME };
    const createPayload: CreateEmailTemplateDto = {
      name: 'Order Confirmation',
      type: TemplateType.ORDER_CONFIRMATION,
      subject: 'Your order',
      body: 'Hello {{name}}',
      isActive: true,
    };
    const updatePayload: UpdateEmailTemplateDto = { subject: 'Updated subject', isActive: false };
    const created = { id: 'tpl-2', ...createPayload };
    const updated = { id: 'tpl-1', ...updatePayload };
    mockApiGet.mockResolvedValueOnce({ data: templates });
    mockApiGet.mockResolvedValueOnce({ data: template });
    mockApiPost.mockResolvedValueOnce({ data: created });
    mockApiPut.mockResolvedValueOnce({ data: updated });
    mockApiDelete.mockResolvedValueOnce({ data: undefined });

    const listResult = await emailService.getAllTemplates();
    const singleResult = await emailService.getTemplateById('tpl-1');
    const createResult = await emailService.createTemplate(createPayload);
    const updateResult = await emailService.updateTemplate('tpl-1', updatePayload);
    await emailService.deleteTemplate('tpl-1');

    expect(api.get).toHaveBeenNthCalledWith(1, '/email/templates');
    expect(api.get).toHaveBeenNthCalledWith(2, '/email/templates/tpl-1');
    expect(api.post).toHaveBeenCalledWith('/email/templates', createPayload);
    expect(api.put).toHaveBeenCalledWith('/email/templates/tpl-1', updatePayload);
    expect(api.delete).toHaveBeenCalledWith('/email/templates/tpl-1');
    expect(listResult).toEqual(templates);
    expect(singleResult).toEqual(template);
    expect(createResult).toEqual(created);
    expect(updateResult).toEqual(updated);
  });

  it('sends direct and template emails', async () => {
    const sendPayload: SendEmailDto = {
      to: 'customer@example.com',
      subject: 'Invoice ready',
      body: 'Your invoice is attached',
    };
    const templatePayload: SendTemplateEmailDto = {
      to: 'customer@example.com',
      templateId: 'tpl-1',
      variables: { name: 'Customer' },
    };
    const sentEmail = { id: 'log-1', status: EmailStatus.SENT };
    const sentTemplateEmail = { id: 'log-2', status: EmailStatus.SENT };
    mockApiPost.mockResolvedValueOnce({ data: sentEmail });
    mockApiPost.mockResolvedValueOnce({ data: sentTemplateEmail });

    const sendResult = await emailService.sendEmail(sendPayload);
    const templateResult = await emailService.sendTemplateEmail(templatePayload);

    expect(api.post).toHaveBeenNthCalledWith(1, '/email/send', sendPayload);
    expect(api.post).toHaveBeenNthCalledWith(2, '/email/send-template', templatePayload);
    expect(sendResult).toEqual(sentEmail);
    expect(templateResult).toEqual(sentTemplateEmail);
  });

  it('gets email logs and log by id', async () => {
    const logs = [{ id: 'log-1', status: EmailStatus.SENT }];
    const log = { id: 'log-1', status: EmailStatus.SENT, subject: 'Invoice ready' };
    mockApiGet.mockResolvedValueOnce({ data: logs });
    mockApiGet.mockResolvedValueOnce({ data: log });

    const logsResult = await emailService.getAllLogs();
    const logResult = await emailService.getLogById('log-1');

    expect(api.get).toHaveBeenNthCalledWith(1, '/email/logs');
    expect(api.get).toHaveBeenNthCalledWith(2, '/email/logs/log-1');
    expect(logsResult).toEqual(logs);
    expect(logResult).toEqual(log);
  });
});
