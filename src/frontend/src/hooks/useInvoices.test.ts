import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  useCreateInvoice,
  useDeleteInvoice,
  useInvoice,
  useInvoices,
  useSendInvoice,
  useUpdateInvoice,
} from './useInvoices';

const {
  useMutationMock,
  useQueryClientMock,
  useQueryMock,
  invalidateQueriesMock,
  invoiceServiceMock,
} = vi.hoisted(() => ({
  useQueryMock: vi.fn(),
  useMutationMock: vi.fn(),
  useQueryClientMock: vi.fn(),
  invalidateQueriesMock: vi.fn(),
  invoiceServiceMock: {
    create: vi.fn(),
    delete: vi.fn(),
    getAll: vi.fn(),
    getById: vi.fn(),
    send: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: useQueryMock,
  useMutation: useMutationMock,
  useQueryClient: useQueryClientMock,
}));

vi.mock('@/services/accounting/invoiceService', () => ({
  invoiceService: invoiceServiceMock,
}));

describe('useInvoices hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useQueryClientMock.mockReturnValue({
      invalidateQueries: invalidateQueriesMock,
    });
    useQueryMock.mockImplementation((options: unknown) => options);
    useMutationMock.mockImplementation((options: {
      mutationFn: (vars: unknown) => Promise<unknown>;
      onSuccess?: () => void;
    }) => ({
      mutateAsync: async (variables: unknown) => {
        const data = await options.mutationFn(variables);
        options.onSuccess?.();
        return data;
      },
    }));
  });

  it('configures invoice list and detail queries with the expected keys', async () => {
    invoiceServiceMock.getAll.mockResolvedValue({ data: [{ id: 'INV-1' }] });
    invoiceServiceMock.getById.mockResolvedValue({ id: 'INV-1' });

    const filters = { page: 2, status: 'draft' };
    const { result: listResult } = renderHook(() => useInvoices(filters));
    const { result: detailResult } = renderHook(() => useInvoice('INV-1'));

    const listQuery = listResult.current as { queryKey: unknown[]; queryFn: () => Promise<unknown> };
    const detailQuery = detailResult.current as {
      queryKey: unknown[];
      enabled: boolean;
      queryFn: () => Promise<unknown>;
    };

    expect(listQuery.queryKey).toEqual(['invoices', filters]);
    await expect(listQuery.queryFn()).resolves.toEqual([{ id: 'INV-1' }]);
    expect(invoiceServiceMock.getAll).toHaveBeenCalledWith(filters);

    expect(detailQuery.queryKey).toEqual(['invoice', 'INV-1']);
    expect(detailQuery.enabled).toBe(true);
    await expect(detailQuery.queryFn()).resolves.toEqual({ id: 'INV-1' });
    expect(invoiceServiceMock.getById).toHaveBeenCalledWith('INV-1');
  });

  it('invalidates list and detail queries after create, update, and send', async () => {
    invoiceServiceMock.create.mockResolvedValue({ id: 'INV-1' });
    invoiceServiceMock.update.mockResolvedValue({ id: 'INV-1' });
    invoiceServiceMock.send.mockResolvedValue({ id: 'INV-1' });

    const { result: createResult } = renderHook(() => useCreateInvoice());
    const { result: updateResult } = renderHook(() => useUpdateInvoice());
    const { result: sendResult } = renderHook(() => useSendInvoice());

    await createResult.current.mutateAsync({ number: 'INV-1' });
    await updateResult.current.mutateAsync({ id: 'INV-1', data: { notes: 'updated' } });
    await sendResult.current.mutateAsync('INV-1');

    expect(invoiceServiceMock.create).toHaveBeenCalledWith({ number: 'INV-1' });
    expect(invoiceServiceMock.update).toHaveBeenCalledWith('INV-1', { notes: 'updated' });
    expect(invoiceServiceMock.send).toHaveBeenCalledWith('INV-1');
    expect(invalidateQueriesMock).toHaveBeenCalledWith({ queryKey: ['invoices'] });
    expect(invalidateQueriesMock).toHaveBeenCalledWith({ queryKey: ['invoice'] });
  });

  it('invalidates the invoice list after delete', async () => {
    invoiceServiceMock.delete.mockResolvedValue(undefined);

    const { result } = renderHook(() => useDeleteInvoice());

    await result.current.mutateAsync('INV-1');

    expect(invoiceServiceMock.delete).toHaveBeenCalledWith('INV-1');
    expect(invalidateQueriesMock).toHaveBeenCalledWith({ queryKey: ['invoices'] });
  });
});
