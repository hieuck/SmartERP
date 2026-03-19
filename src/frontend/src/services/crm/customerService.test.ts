import customerService, {
  CustomerStatus,
  type CreateCustomerDto,
  type UpdateCustomerDto,
} from './customerService';
import api from './api';
import { vi } from 'vitest';

vi.mock('./api');

const mockApiGet = vi.mocked(api.get);
const mockApiPost = vi.mocked(api.post);
const mockApiPut = vi.mocked(api.put);
const mockApiPatch = vi.mocked(api.patch);
const mockApiDelete = vi.mocked(api.delete);

describe('customerService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('gets all customers with query params', async () => {
    const params = { page: 2, limit: 25, status: CustomerStatus.ACTIVE, search: 'acme' };
    const response = { data: [{ id: 'cus-1', name: 'Acme' }], meta: { total: 1 } };
    mockApiGet.mockResolvedValue({ data: response });

    const result = await customerService.getAll(params);

    expect(api.get).toHaveBeenCalledWith('/customers', { params });
    expect(result).toEqual(response);
  });

  it('gets a customer by id', async () => {
    const customer = { id: 'cus-1', name: 'Acme', status: CustomerStatus.ACTIVE };
    mockApiGet.mockResolvedValue({ data: customer });

    const result = await customerService.getById('cus-1');

    expect(api.get).toHaveBeenCalledWith('/customers/cus-1');
    expect(result).toEqual(customer);
  });

  it('creates a customer', async () => {
    const payload: CreateCustomerDto = {
      code: 'C001',
      name: 'Acme',
      email: 'acme@example.com',
      creditLimit: 10000,
    };
    const created = { id: 'cus-1', ...payload, status: CustomerStatus.ACTIVE };
    mockApiPost.mockResolvedValue({ data: created });

    const result = await customerService.create(payload);

    expect(api.post).toHaveBeenCalledWith('/customers', payload);
    expect(result).toEqual(created);
  });

  it('updates a customer', async () => {
    const payload: UpdateCustomerDto = {
      status: CustomerStatus.BLOCKED,
      notes: 'Overdue balance',
    };
    const updated = { id: 'cus-1', ...payload };
    mockApiPut.mockResolvedValue({ data: updated });

    const result = await customerService.update('cus-1', payload);

    expect(api.put).toHaveBeenCalledWith('/customers/cus-1', payload);
    expect(result).toEqual(updated);
  });

  it('deletes a customer', async () => {
    mockApiDelete.mockResolvedValue({ data: undefined });

    await customerService.delete('cus-1');

    expect(api.delete).toHaveBeenCalledWith('/customers/cus-1');
  });

  it('updates customer balance', async () => {
    const updated = { id: 'cus-1', balance: 2500 };
    mockApiPatch.mockResolvedValue({ data: updated });

    const result = await customerService.updateBalance('cus-1', 2500);

    expect(api.patch).toHaveBeenCalledWith('/customers/cus-1/balance', { amount: 2500 });
    expect(result).toEqual(updated);
  });

  it('gets customer statistics', async () => {
    const stats = {
      totalCustomers: 100,
      activeCustomers: 85,
      totalRevenue: 250000,
      averageOrderValue: 1250,
    };
    mockApiGet.mockResolvedValue({ data: stats });

    const result = await customerService.getStatistics();

    expect(api.get).toHaveBeenCalledWith('/customers/statistics');
    expect(result).toEqual(stats);
  });

  it('gets top customers with default limit', async () => {
    const topCustomers = [{ id: 'cus-1', name: 'Acme', totalSpent: 50000, orderCount: 12 }];
    mockApiGet.mockResolvedValue({ data: topCustomers });

    const result = await customerService.getTopCustomers();

    expect(api.get).toHaveBeenCalledWith('/customers/top', { params: { limit: 10 } });
    expect(result).toEqual(topCustomers);
  });

  it('supports legacy customer methods for backward compatibility', async () => {
    const listResponse = { data: [{ id: 'cus-1', name: 'Acme' }], meta: { total: 1 } };
    const customer = { id: 'cus-1', name: 'Acme', status: CustomerStatus.ACTIVE };
    const created = { id: 'cus-2', name: 'New Co', code: 'C002' };
    const updated = { id: 'cus-1', name: 'Acme Updated' };
    mockApiGet.mockResolvedValueOnce({ data: listResponse });
    mockApiGet.mockResolvedValueOnce({ data: customer });
    mockApiPost.mockResolvedValueOnce({ data: created });
    mockApiPut.mockResolvedValueOnce({ data: updated });
    mockApiDelete.mockResolvedValueOnce({ data: undefined });

    const listed = await customerService.getCustomers({ limit: 5 });
    const got = await customerService.getCustomer('cus-1');
    const legacyCreated = await customerService.createCustomer({
      code: 'C002',
      name: 'New Co',
    });
    const legacyUpdated = await customerService.updateCustomer('cus-1', {
      name: 'Acme Updated',
    });
    await customerService.deleteCustomer('cus-1');

    expect(api.get).toHaveBeenNthCalledWith(1, '/customers', { params: { limit: 5 } });
    expect(api.get).toHaveBeenNthCalledWith(2, '/customers/cus-1');
    expect(api.post).toHaveBeenCalledWith('/customers', { code: 'C002', name: 'New Co' });
    expect(api.put).toHaveBeenCalledWith('/customers/cus-1', { name: 'Acme Updated' });
    expect(api.delete).toHaveBeenCalledWith('/customers/cus-1');
    expect(listed).toEqual(listResponse);
    expect(got).toEqual(customer);
    expect(legacyCreated).toEqual(created);
    expect(legacyUpdated).toEqual(updated);
  });
});
