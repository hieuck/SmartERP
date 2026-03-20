import api from './api';

export type JournalEntryStatus = 'draft' | 'posted' | 'cancelled';

interface BackendJournalEntry {
  id: string;
  number?: string;
  date: string;
  reference?: string;
  memo?: string;
  description?: string;
  totalDebit: number;
  totalCredit: number;
  status: JournalEntryStatus;
}

export interface JournalEntry {
  id: string;
  date: string;
  reference: string;
  description: string;
  totalDebit: number;
  totalCredit: number;
  status: JournalEntryStatus;
}

export interface JournalEntryQueryParams {
  startDate?: string;
  endDate?: string;
}

function unwrapApiData<T>(payload: T | { data?: T }): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data?: T }).data as T;
  }

  return payload as T;
}

function normalizeEntry(entry: BackendJournalEntry): JournalEntry {
  return {
    id: entry.id,
    date: entry.date,
    reference: entry.reference ?? entry.number ?? '',
    description: entry.description ?? entry.memo ?? '',
    totalDebit: entry.totalDebit ?? 0,
    totalCredit: entry.totalCredit ?? 0,
    status: entry.status,
  };
}

export const journalEntryService = {
  getAll: async (params: JournalEntryQueryParams = {}): Promise<JournalEntry[]> => {
    const response = await api.get('/accounting/journal-entries', { params });
    return unwrapApiData<BackendJournalEntry[]>(response.data).map(normalizeEntry);
  },

  post: async (id: string): Promise<JournalEntry> => {
    const response = await api.post(`/accounting/journal-entries/${id}/post`);
    return normalizeEntry(unwrapApiData<BackendJournalEntry>(response.data));
  },
};

export default journalEntryService;
