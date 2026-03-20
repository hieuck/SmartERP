import journalEntryService from './journalEntryService';
import api from './api';
import { vi } from 'vitest';

vi.mock('./api');

const mockApiGet = vi.mocked(api.get);
const mockApiPost = vi.mocked(api.post);

describe('journalEntryService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('unwraps and normalizes journal entries', async () => {
    mockApiGet.mockResolvedValue({
      data: {
        data: [
          {
            id: 'je-1',
            number: 'JE-2026-0001',
            date: '2026-03-20',
            memo: 'Opening balance',
            totalDebit: 100,
            totalCredit: 100,
            status: 'draft',
          },
        ],
      },
    });

    await expect(
      journalEntryService.getAll({ startDate: '2026-03-01', endDate: '2026-03-31' }),
    ).resolves.toEqual([
      {
        id: 'je-1',
        date: '2026-03-20',
        reference: 'JE-2026-0001',
        description: 'Opening balance',
        totalDebit: 100,
        totalCredit: 100,
        status: 'draft',
      },
    ]);
    expect(api.get).toHaveBeenCalledWith('/accounting/journal-entries', {
      params: { startDate: '2026-03-01', endDate: '2026-03-31' },
    });
  });

  it('posts a journal entry', async () => {
    mockApiPost.mockResolvedValue({
      data: {
        data: {
          id: 'je-1',
          number: 'JE-2026-0001',
          date: '2026-03-20',
          memo: 'Opening balance',
          totalDebit: 100,
          totalCredit: 100,
          status: 'posted',
        },
      },
    });

    await expect(journalEntryService.post('je-1')).resolves.toMatchObject({ status: 'posted' });
    expect(api.post).toHaveBeenCalledWith('/accounting/journal-entries/je-1/post');
  });
});
