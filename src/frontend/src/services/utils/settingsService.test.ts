import {
  SettingCategory,
  SettingDataType,
  settingsService,
  type CreateSettingDto,
  type UpdateSettingDto,
} from './settingsService';
import api from './api';
import { vi } from 'vitest';

vi.mock('./api');

const mockApiGet = vi.mocked(api.get);
const mockApiPost = vi.mocked(api.post);
const mockApiPatch = vi.mocked(api.patch);
const mockApiDelete = vi.mocked(api.delete);

describe('settingsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('unwraps envelope responses for list endpoints', async () => {
    const generalSettings = [{ key: 'app.name', category: SettingCategory.GENERAL }];
    const publicSettings = [{ key: 'public.theme', category: SettingCategory.GENERAL }];
    mockApiGet
      .mockResolvedValueOnce({
        data: { success: true, data: generalSettings, message: 'Data retrieved successfully' },
      })
      .mockResolvedValueOnce({
        data: { success: true, data: publicSettings, message: 'Data retrieved successfully' },
      });

    const allResult = await settingsService.getAll();
    const publicResult = await settingsService.getPublic();

    expect(allResult).toEqual(generalSettings);
    expect(publicResult).toEqual(publicSettings);
  });

  it('gets all settings and settings by category through the same endpoint', async () => {
    const generalSettings = [{ key: 'app.name', category: SettingCategory.GENERAL }];
    const emailSettings = [{ key: 'email.from', category: SettingCategory.EMAIL }];
    mockApiGet.mockResolvedValueOnce({ data: generalSettings });
    mockApiGet.mockResolvedValueOnce({ data: emailSettings });

    const allResult = await settingsService.getAll();
    const byCategoryResult = await settingsService.getByCategory(SettingCategory.EMAIL);

    expect(api.get).toHaveBeenNthCalledWith(1, '/settings', { params: { category: undefined } });
    expect(api.get).toHaveBeenNthCalledWith(2, '/settings', {
      params: { category: SettingCategory.EMAIL },
    });
    expect(allResult).toEqual(generalSettings);
    expect(byCategoryResult).toEqual(emailSettings);
  });

  it('gets a setting by key', async () => {
    const setting = { key: 'app.name', value: 'SmartERP', category: SettingCategory.GENERAL };
    mockApiGet.mockResolvedValueOnce({ data: setting });

    const result = await settingsService.getByKey('app.name');

    expect(api.get).toHaveBeenCalledWith('/settings/app.name');
    expect(result).toEqual(setting);
  });

  it('creates, updates, and deletes a setting', async () => {
    const createPayload: CreateSettingDto = {
      key: 'app.name',
      value: 'SmartERP',
      dataType: SettingDataType.STRING,
      category: SettingCategory.GENERAL,
      isPublic: true,
    };
    const updatePayload: UpdateSettingDto = {
      value: 'SmartERP Next',
      isPublic: false,
    };
    const created = { id: 'setting-1', ...createPayload };
    const updated = { id: 'setting-1', ...updatePayload };
    mockApiPost.mockResolvedValueOnce({ data: created });
    mockApiPatch.mockResolvedValueOnce({ data: updated });
    mockApiDelete.mockResolvedValueOnce({ data: undefined });

    const createResult = await settingsService.create(createPayload);
    const updateResult = await settingsService.update('app.name', updatePayload);
    await settingsService.delete('app.name');

    expect(api.post).toHaveBeenCalledWith('/settings', createPayload);
    expect(api.patch).toHaveBeenCalledWith('/settings/app.name', updatePayload);
    expect(api.delete).toHaveBeenCalledWith('/settings/app.name');
    expect(createResult).toEqual(created);
    expect(updateResult).toEqual(updated);
  });

  it('unwraps envelope responses for write operations', async () => {
    const createPayload: CreateSettingDto = {
      key: 'app.name',
      value: 'SmartERP',
      dataType: SettingDataType.STRING,
      category: SettingCategory.GENERAL,
      isPublic: true,
    };
    const updatePayload: UpdateSettingDto = {
      value: 'SmartERP Next',
      isPublic: false,
    };
    const created = { id: 'setting-1', ...createPayload };
    const updated = { id: 'setting-1', ...updatePayload, category: SettingCategory.GENERAL };
    mockApiPost.mockResolvedValueOnce({
      data: { success: true, data: created, message: 'Created' },
    });
    mockApiPatch.mockResolvedValueOnce({
      data: { success: true, data: updated, message: 'Updated' },
    });

    const createResult = await settingsService.create(createPayload);
    const updateResult = await settingsService.update('app.name', updatePayload);

    expect(createResult).toEqual(created);
    expect(updateResult).toEqual(updated);
  });

  it('bulk upserts settings and gets public settings', async () => {
    const payload: CreateSettingDto[] = [
      {
        key: 'app.name',
        value: 'SmartERP',
        dataType: SettingDataType.STRING,
        category: SettingCategory.GENERAL,
      },
      {
        key: 'email.enabled',
        value: 'true',
        dataType: SettingDataType.BOOLEAN,
        category: SettingCategory.EMAIL,
      },
    ];
    const upserted = payload.map((item, index) => ({ id: `setting-${index + 1}`, ...item }));
    const publicSettings = [upserted[0]];
    mockApiPost.mockResolvedValueOnce({ data: upserted });
    mockApiGet.mockResolvedValueOnce({ data: publicSettings });

    const upsertResult = await settingsService.bulkUpsert(payload);
    const publicResult = await settingsService.getPublic();

    expect(api.post).toHaveBeenCalledWith('/settings/bulk', { settings: payload });
    expect(api.get).toHaveBeenCalledWith('/settings/public');
    expect(upsertResult).toEqual(upserted);
    expect(publicResult).toEqual(publicSettings);
  });
});
