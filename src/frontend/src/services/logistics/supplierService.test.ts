import supplierService, { SupplierStatus } from './supplierService';
import api from './api';
import { vi } from 'vitest';

vi.mock('./api');

const mockApiGet = vi.mocked(api.get);
const mockApiPost = vi.mocked(api.post);
const mockApiPut = vi.mocked(api.put);
const mockApiPatch = vi.mocked(api.patch);
const mockApiDelete = vi.mocked(api.delete);

describe('supplierService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('gets suppliers with query params', async () => {
    const params = { page: 1, limit: 20, status: SupplierStatus.ACTIVE, search: 'acme' };
    const mockResponse = { data: { data: [], meta: { total: 0 } } };
    mockApiGet.mockResolvedValue(mockResponse);

    const result = await supplierService.getAll(params);

    expect(api.get).toHaveBeenCalledWith('/suppliers', { params });
    expect(result).toEqual(mockResponse.data);
  });

  it('gets a supplier by id', async () => {
    const mockSupplier = { id: 'sup-1', code: 'SUP-001', name: 'ACME' };
    mockApiGet.mockResolvedValue({ data: mockSupplier });

    const result = await supplierService.getById('sup-1');

    expect(api.get).toHaveBeenCalledWith('/suppliers/sup-1');
    expect(result).toEqual(mockSupplier);
  });

  it('creates a supplier', async () => {
    const payload = {
      code: 'SUP-002',
      name: 'New Supplier',
      email: 'supplier@example.com',
    };
    const mockSupplier = { id: 'sup-2', ...payload, status: SupplierStatus.ACTIVE };
    mockApiPost.mockResolvedValue({ data: mockSupplier });

    const result = await supplierService.create(payload);

    expect(api.post).toHaveBeenCalledWith('/suppliers', payload);
    expect(result).toEqual(mockSupplier);
  });

  it('updates a supplier', async () => {
    const patch = { name: 'Updated Supplier', status: SupplierStatus.INACTIVE };
    const mockSupplier = { id: 'sup-1', ...patch };
    mockApiPut.mockResolvedValue({ data: mockSupplier });

    const result = await supplierService.update('sup-1', patch);

    expect(api.put).toHaveBeenCalledWith('/suppliers/sup-1', patch);
    expect(result).toEqual(mockSupplier);
  });

  it('deletes a supplier', async () => {
    mockApiDelete.mockResolvedValue({ data: undefined });

    await supplierService.delete('sup-1');

    expect(api.delete).toHaveBeenCalledWith('/suppliers/sup-1');
  });

  it('updates supplier balance', async () => {
    const mockSupplier = { id: 'sup-1', balance: 2500 };
    mockApiPatch.mockResolvedValue({ data: mockSupplier });

    const result = await supplierService.updateBalance('sup-1', 2500);

    expect(api.patch).toHaveBeenCalledWith('/suppliers/sup-1/balance', { amount: 2500 });
    expect(result).toEqual(mockSupplier);
  });

  it('updates supplier rating', async () => {
    const mockSupplier = { id: 'sup-1', rating: 4.8 };
    mockApiPatch.mockResolvedValue({ data: mockSupplier });

    const result = await supplierService.updateRating('sup-1', 4.8);

    expect(api.patch).toHaveBeenCalledWith('/suppliers/sup-1/rating', { rating: 4.8 });
    expect(result).toEqual(mockSupplier);
  });

  it('gets supplier statistics', async () => {
    const mockStats = {
      totalSuppliers: 20,
      activeSuppliers: 16,
      totalPurchases: 120000,
      averagePurchaseValue: 6000,
    };
    mockApiGet.mockResolvedValue({ data: mockStats });

    const result = await supplierService.getStatistics();

    expect(api.get).toHaveBeenCalledWith('/suppliers/statistics');
    expect(result).toEqual(mockStats);
  });

  it('keeps legacy getSuppliers compatibility', async () => {
    const mockResponse = { data: { data: [{ id: 'sup-1' }] } };
    mockApiGet.mockResolvedValue(mockResponse);

    const result = await supplierService.getSuppliers();

    expect(api.get).toHaveBeenCalledWith('/suppliers', { params: {} });
    expect(result).toEqual(mockResponse.data);
  });

  it('keeps legacy create and update compatibility', async () => {
    const created = { id: 'sup-2', code: 'SUP-002', name: 'Created' };
    const updated = { id: 'sup-2', name: 'Updated' };
    mockApiPost.mockResolvedValue({ data: created });
    mockApiPut.mockResolvedValue({ data: updated });

    const createResult = await supplierService.createSupplier({
      code: 'SUP-002',
      name: 'Created',
    });
    const updateResult = await supplierService.updateSupplier('sup-2', {
      name: 'Updated',
    });

    expect(createResult).toEqual(created);
    expect(updateResult).toEqual(updated);
  });
});
