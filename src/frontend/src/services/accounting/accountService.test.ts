import accountService from './accountService';
import api from './api';
import { vi } from 'vitest';

vi.mock('./api');

const mockApiGet = vi.mocked(api.get);
const mockApiPost = vi.mocked(api.post);
const mockApiPut = vi.mocked(api.put);
const mockApiDelete = vi.mocked(api.delete);

describe('accountService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('unwraps account list responses', async () => {
    mockApiGet.mockResolvedValue({
      data: {
        data: [{ id: 'acc-1', code: '1110', name: 'Cash', type: 'asset', balance: 0, isGroup: false }],
      },
    });

    await expect(accountService.getAll()).resolves.toEqual([
      { id: 'acc-1', code: '1110', name: 'Cash', type: 'asset', balance: 0, isGroup: false },
    ]);
    expect(api.get).toHaveBeenCalledWith('/accounting/accounts', { params: undefined });
  });

  it('gets an account by id', async () => {
    mockApiGet.mockResolvedValue({
      data: { data: { id: 'acc-1', code: '1110', name: 'Cash', type: 'asset', balance: 0, isGroup: false } },
    });

    await expect(accountService.getById('acc-1')).resolves.toMatchObject({ id: 'acc-1' });
    expect(api.get).toHaveBeenCalledWith('/accounting/accounts/acc-1');
  });

  it('creates and updates accounts through the accounting endpoints', async () => {
    const payload = { code: '1110', name: 'Cash', type: 'asset' as const, isGroup: false };
    mockApiPost.mockResolvedValue({ data: { data: { id: 'acc-1', ...payload, balance: 0 } } });
    mockApiPut.mockResolvedValue({ data: { data: { id: 'acc-1', ...payload, balance: 10 } } });

    await expect(accountService.create(payload)).resolves.toMatchObject({ id: 'acc-1' });
    await expect(accountService.update('acc-1', payload)).resolves.toMatchObject({ balance: 10 });
    expect(api.post).toHaveBeenCalledWith('/accounting/accounts', payload);
    expect(api.put).toHaveBeenCalledWith('/accounting/accounts/acc-1', payload);
  });

  it('deletes an account', async () => {
    mockApiDelete.mockResolvedValue({ data: {} });

    await expect(accountService.delete('acc-1')).resolves.toBeUndefined();
    expect(api.delete).toHaveBeenCalledWith('/accounting/accounts/acc-1');
  });
});
