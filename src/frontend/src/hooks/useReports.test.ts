import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  useCashFlowReport,
  useExportReportExcel,
  useExportReportPDF,
  useInventoryReport,
  useSalesReport,
  useTopCustomersReport,
} from './useReports';

const { useQueryMock, reportingServiceMock, createObjectURLMock, revokeObjectURLMock, clickMock } =
  vi.hoisted(() => ({
    useQueryMock: vi.fn(),
    reportingServiceMock: {
      exportCustomerReport: vi.fn(),
      exportFinancialReport: vi.fn(),
      exportInventoryReport: vi.fn(),
      exportSalesReport: vi.fn(),
      getCashFlow: vi.fn(),
      getInventoryReport: vi.fn(),
      getSalesReport: vi.fn(),
      getTopCustomers: vi.fn(),
    },
    createObjectURLMock: vi.fn(() => 'blob:report'),
    revokeObjectURLMock: vi.fn(),
    clickMock: vi.fn(),
  }));

vi.mock('@tanstack/react-query', () => ({
  useQuery: useQueryMock,
}));

vi.mock('@/services/report/reportingService', () => ({
  default: reportingServiceMock,
}));

describe('useReports hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useQueryMock.mockImplementation((options: unknown) => options);

    vi.spyOn(window.URL, 'createObjectURL').mockImplementation(createObjectURLMock);
    vi.spyOn(window.URL, 'revokeObjectURL').mockImplementation(revokeObjectURLMock);
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(clickMock);
  });

  it('configures report queries with the expected keys and enabled flags', async () => {
    reportingServiceMock.getSalesReport.mockResolvedValue({ totalSales: 10 });
    reportingServiceMock.getInventoryReport.mockResolvedValue({ totalItems: 5 });
    reportingServiceMock.getTopCustomers.mockResolvedValue([{ id: 'C1' }]);
    reportingServiceMock.getCashFlow.mockResolvedValue({ incoming: 10 });

    const params = { startDate: '2026-03-01', endDate: '2026-03-31' };
    const { result: salesResult } = renderHook(() => useSalesReport(params));
    const { result: inventoryResult } = renderHook(() => useInventoryReport());
    const { result: topCustomersResult } = renderHook(() => useTopCustomersReport(params));
    const { result: cashFlowResult } = renderHook(() => useCashFlowReport(params));

    const salesQuery = salesResult.current as { queryKey: unknown[]; enabled: boolean; queryFn: () => Promise<unknown> };
    const inventoryQuery = inventoryResult.current as { queryKey: unknown[]; queryFn: () => Promise<unknown> };
    const topCustomersQuery = topCustomersResult.current as {
      queryKey: unknown[];
      enabled: boolean;
      queryFn: () => Promise<unknown>;
    };
    const cashFlowQuery = cashFlowResult.current as {
      queryKey: unknown[];
      enabled: boolean;
      queryFn: () => Promise<unknown>;
    };

    expect(salesQuery.queryKey).toEqual(['report', 'sales', params]);
    expect(salesQuery.enabled).toBe(true);
    await expect(salesQuery.queryFn()).resolves.toEqual({ totalSales: 10 });

    expect(inventoryQuery.queryKey).toEqual(['report', 'inventory']);
    await expect(inventoryQuery.queryFn()).resolves.toEqual({ totalItems: 5 });

    expect(topCustomersQuery.queryKey).toEqual(['report', 'top-customers', params]);
    expect(topCustomersQuery.enabled).toBe(true);
    await expect(topCustomersQuery.queryFn()).resolves.toEqual([{ id: 'C1' }]);
    expect(reportingServiceMock.getTopCustomers).toHaveBeenCalledWith(10);

    expect(cashFlowQuery.queryKey).toEqual(['report', 'cash-flow', params]);
    expect(cashFlowQuery.enabled).toBe(true);
    await expect(cashFlowQuery.queryFn()).resolves.toEqual({ incoming: 10 });
  });

  it('exports PDF reports through the matching service endpoint and download flow', async () => {
    const blob = new Blob(['pdf']);
    reportingServiceMock.exportInventoryReport.mockResolvedValue(blob);

    const { result } = renderHook(() => useExportReportPDF());

    await expect(
      result.current('inventory', { startDate: '2026-03-01', endDate: '2026-03-31' }),
    ).resolves.toEqual({ success: true });

    expect(reportingServiceMock.exportInventoryReport).toHaveBeenCalledWith('pdf');
    expect(createObjectURLMock).toHaveBeenCalledWith(blob);
    expect(clickMock).toHaveBeenCalled();
    expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:report');
  });

  it('exports Excel reports through the matching service endpoint and download flow', async () => {
    const blob = new Blob(['xlsx']);
    const params = { startDate: '2026-03-01', endDate: '2026-03-31' };
    reportingServiceMock.exportFinancialReport.mockResolvedValue(blob);

    const { result } = renderHook(() => useExportReportExcel());

    await expect(result.current('financial', params)).resolves.toEqual({ success: true });

    expect(reportingServiceMock.exportFinancialReport).toHaveBeenCalledWith(params, 'excel');
    expect(createObjectURLMock).toHaveBeenCalledWith(blob);
    expect(clickMock).toHaveBeenCalled();
    expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:report');
  });
});
