import api from './api';

export type AccountType = 'asset' | 'liability' | 'equity' | 'income' | 'expense';

export interface Account {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  balance: number;
  isGroup: boolean;
  parentId?: string;
  description?: string;
}

export interface AccountFormValues {
  code: string;
  name: string;
  type: AccountType;
  parentId?: string;
  isGroup: boolean;
  description?: string;
}

function unwrapApiData<T>(payload: T | { data?: T }): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data?: T }).data as T;
  }

  return payload as T;
}

export const accountService = {
  getAll: async (type?: AccountType): Promise<Account[]> => {
    const response = await api.get('/accounting/accounts', {
      params: type ? { type } : undefined,
    });
    return unwrapApiData<Account[]>(response.data) ?? [];
  },

  getById: async (id: string): Promise<Account> => {
    const response = await api.get(`/accounting/accounts/${id}`);
    return unwrapApiData<Account>(response.data);
  },

  create: async (data: AccountFormValues): Promise<Account> => {
    const response = await api.post('/accounting/accounts', data);
    return unwrapApiData<Account>(response.data);
  },

  update: async (id: string, data: AccountFormValues): Promise<Account> => {
    const response = await api.put(`/accounting/accounts/${id}`, data);
    return unwrapApiData<Account>(response.data);
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/accounting/accounts/${id}`);
  },
};

export default accountService;
