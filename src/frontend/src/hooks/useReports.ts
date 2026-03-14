import { useQuery, UseQueryResult } from '@tanstack/react-query';
import reportingService from '@/services/report/reportingService';

interface ReportParams {
  startDate: string;
  endDate: string;
}

/**
 * Hook for fetching sales report
 * @param params - Report parameters (startDate, endDate)
 * @returns Query result with report data
 */
export const useSalesReport = (params: ReportParams): UseQueryResult<any, Error> => {
  return useQuery({
    queryKey: ['report', 'sales', params],
    queryFn: async () => {
      const data = await reportingService.getSalesReport(params);
      return data;
    },
    enabled: !!params.startDate && !!params.endDate,
  });
};

/**
 * Hook for fetching daily sales report
 */
export const useDailySalesReport = (params: ReportParams): UseQueryResult<any, Error> => {
  return useQuery({
    queryKey: ['report', 'daily-sales', params],
    queryFn: async () => {
      const data = await reportingService.getDailySales(params);
      return data;
    },
    enabled: !!params.startDate && !!params.endDate,
  });
};

/**
 * Hook for fetching product performance report
 */
export const useProductPerformanceReport = (params: ReportParams): UseQueryResult<any, Error> => {
  return useQuery({
    queryKey: ['report', 'product-performance', params],
    queryFn: async () => {
      const data = await reportingService.getProductPerformance(params);
      return data;
    },
    enabled: !!params.startDate && !!params.endDate,
  });
};

/**
 * Hook for fetching inventory report
 */
export const useInventoryReport = (): UseQueryResult<any, Error> => {
  return useQuery({
    queryKey: ['report', 'inventory'],
    queryFn: async () => {
      const data = await reportingService.getInventoryReport();
      return data;
    },
  });
};

/**
 * Hook for fetching low stock report
 */
export const useLowStockReport = (): UseQueryResult<any, Error> => {
  return useQuery({
    queryKey: ['report', 'inventory-low-stock'],
    queryFn: async () => {
      const data = await reportingService.getLowStockReport();
      return data;
    },
  });
};

/**
 * Hook for fetching inventory movements report
 */
export const useInventoryMovementsReport = (params: ReportParams): UseQueryResult<any, Error> => {
  return useQuery({
    queryKey: ['report', 'inventory-movements', params],
    queryFn: async () => {
      const data = await reportingService.getInventoryMovements(params);
      return data;
    },
    enabled: !!params.startDate && !!params.endDate,
  });
};

/**
 * Hook for fetching customer report
 */
export const useCustomerReport = (params: ReportParams): UseQueryResult<any, Error> => {
  return useQuery({
    queryKey: ['report', 'customers', params],
    queryFn: async () => {
      const data = await reportingService.getCustomerReport(params);
      return data;
    },
    enabled: !!params.startDate && !!params.endDate,
  });
};

/**
 * Hook for fetching top customers report
 */
export const useTopCustomersReport = (params: ReportParams): UseQueryResult<any, Error> => {
  return useQuery({
    queryKey: ['report', 'top-customers', params],
    queryFn: async () => {
      const data = await reportingService.getTopCustomers(params);
      return data;
    },
    enabled: !!params.startDate && !!params.endDate,
  });
};

/**
 * Hook for fetching financial report
 */
export const useFinancialReport = (params: ReportParams): UseQueryResult<any, Error> => {
  return useQuery({
    queryKey: ['report', 'financial', params],
    queryFn: async () => {
      const data = await reportingService.getFinancialReport(params);
      return data;
    },
    enabled: !!params.startDate && !!params.endDate,
  });
};

/**
 * Hook for fetching profit and loss report
 */
export const useProfitLossReport = (params: ReportParams): UseQueryResult<any, Error> => {
  return useQuery({
    queryKey: ['report', 'profit-loss', params],
    queryFn: async () => {
      const data = await reportingService.getProfitLoss(params);
      return data;
    },
    enabled: !!params.startDate && !!params.endDate,
  });
};

/**
 * Hook for fetching cash flow report
 */
export const useCashFlowReport = (params: ReportParams): UseQueryResult<any, Error> => {
  return useQuery({
    queryKey: ['report', 'cash-flow', params],
    queryFn: async () => {
      const data = await reportingService.getCashFlow(params);
      return data;
    },
    enabled: !!params.startDate && !!params.endDate,
  });
};

/**
 * Hook for exporting report to PDF
 */
export const useExportReportPDF = () => {
  return async (reportType: string, params: ReportParams) => {
    try {
      const blob = await reportingService.exportPDF(reportType, params);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${reportType}-${new Date().toISOString().split('T')[0]}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
      return { success: true };
    } catch (error) {
      throw error;
    }
  };
};

/**
 * Hook for exporting report to Excel
 */
export const useExportReportExcel = () => {
  return async (reportType: string, params: ReportParams) => {
    try {
      const blob = await reportingService.exportExcel(reportType, params);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${reportType}-${new Date().toISOString().split('T')[0]}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);
      return { success: true };
    } catch (error) {
      throw error;
    }
  };
};
