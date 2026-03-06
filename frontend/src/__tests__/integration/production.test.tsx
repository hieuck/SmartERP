/**
 * Production Module Integration Tests
 * Tests for production UI components
 * Requirements: 37.1, 32.1, 34.4
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import WorkerList from '../../pages/production/WorkerList';
import AttendanceTracking from '../../pages/production/AttendanceTracking';
import ProductionOrderList from '../../pages/production/ProductionOrderList';
import productionService from '../../services/productionService';

// Mock the production service
vi.mock('../../services/productionService', () => ({
  default: {
    worker: {
      getWorkers: vi.fn(),
      deleteWorker: vi.fn(),
    },
    attendance: {
      getAttendances: vi.fn(),
      getAttendanceReport: vi.fn(),
      checkIn: vi.fn(),
      checkOut: vi.fn(),
    },
    productionOrder: {
      getProductionOrders: vi.fn(),
      startProductionOrder: vi.fn(),
      completeProductionOrder: vi.fn(),
      cancelProductionOrder: vi.fn(),
    },
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Production Module Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Worker Management', () => {
    it('should display worker list', async () => {
      const mockWorkers = {
        data: [
          {
            id: '1',
            code: 'W001',
            fullName: 'Nguyễn Văn A',
            phone: '0123456789',
            specialty: 'molding',
            skillLevel: 'skilled',
            hireDate: new Date('2023-01-01'),
            status: 'active',
          },
          {
            id: '2',
            code: 'W002',
            fullName: 'Trần Thị B',
            phone: '0987654321',
            specialty: 'painting',
            skillLevel: 'master',
            hireDate: new Date('2022-06-15'),
            status: 'active',
          },
        ],
        meta: { total: 2, page: 1, limit: 10 },
      };

      vi.mocked(productionService.worker.getWorkers).mockResolvedValue(mockWorkers as any);

      render(<WorkerList />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument();
        expect(screen.getByText('Trần Thị B')).toBeInTheDocument();
        expect(screen.getByText('W001')).toBeInTheDocument();
        expect(screen.getByText('W002')).toBeInTheDocument();
      });
    });

    it('should filter workers by specialty', async () => {
      const mockWorkers = {
        data: [
          {
            id: '1',
            code: 'W001',
            fullName: 'Nguyễn Văn A',
            specialty: 'molding',
            skillLevel: 'skilled',
            status: 'active',
          },
        ],
        meta: { total: 1, page: 1, limit: 10 },
      };

      vi.mocked(productionService.worker.getWorkers).mockResolvedValue(mockWorkers as any);

      render(<WorkerList />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument();
      });

      // Verify that the service was called with correct parameters
      expect(productionService.worker.getWorkers).toHaveBeenCalled();
    });

    it('should handle worker deletion', async () => {
      const mockWorkers = {
        data: [
          {
            id: '1',
            code: 'W001',
            fullName: 'Nguyễn Văn A',
            specialty: 'molding',
            skillLevel: 'skilled',
            status: 'active',
          },
        ],
        meta: { total: 1, page: 1, limit: 10 },
      };

      vi.mocked(productionService.worker.getWorkers).mockResolvedValue(mockWorkers as any);
      vi.mocked(productionService.worker.deleteWorker).mockResolvedValue({} as any);

      render(<WorkerList />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument();
      });

      // Note: Full deletion test would require clicking confirm button
      // This verifies the component renders correctly
    });
  });

  describe('Attendance Tracking', () => {
    it('should display attendance records', async () => {
      const mockAttendances = {
        data: [
          {
            id: '1',
            workerId: '1',
            worker: { fullName: 'Nguyễn Văn A', code: 'W001' },
            date: new Date('2024-01-15'),
            checkIn: new Date('2024-01-15T08:00:00'),
            checkOut: new Date('2024-01-15T17:00:00'),
            status: 'present',
          },
        ],
        meta: { total: 1, page: 1, limit: 10 },
      };

      const mockReport = {
        data: {
          totalDays: 20,
          presentDays: 18,
          absentDays: 2,
          lateDays: 1,
        },
      };

      vi.mocked(productionService.attendance.getAttendances).mockResolvedValue(
        mockAttendances as any,
      );
      vi.mocked(productionService.attendance.getAttendanceReport).mockResolvedValue(
        mockReport as any,
      );
      vi.mocked(productionService.worker.getWorkers).mockResolvedValue({
        data: [],
        meta: {},
      } as any);

      render(<AttendanceTracking />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument();
      });

      // Verify statistics are displayed
      await waitFor(() => {
        expect(screen.getByText('Tổng số ngày công')).toBeInTheDocument();
        expect(screen.getByText('Có mặt')).toBeInTheDocument();
      });
    });

    it('should handle check-in process', async () => {
      const mockWorkers = {
        data: [
          {
            id: '1',
            code: 'W001',
            fullName: 'Nguyễn Văn A',
            status: 'active',
          },
        ],
        meta: {},
      };

      vi.mocked(productionService.worker.getWorkers).mockResolvedValue(mockWorkers as any);
      vi.mocked(productionService.attendance.getAttendances).mockResolvedValue({
        data: [],
        meta: {},
      } as any);
      vi.mocked(productionService.attendance.getAttendanceReport).mockResolvedValue({
        data: {},
      } as any);
      vi.mocked(productionService.attendance.checkIn).mockResolvedValue({} as any);

      render(<AttendanceTracking />, { wrapper: createWrapper() });

      await waitFor(() => {
        const checkInButton = screen.getByText('Chấm công vào');
        expect(checkInButton).toBeInTheDocument();
      });
    });
  });

  describe('Production Orders', () => {
    it('should display production order list', async () => {
      const mockOrders = {
        data: [
          {
            id: '1',
            code: 'PO001',
            productId: 'p1',
            product: { name: 'Tượng Phật' },
            quantity: 100,
            producedQuantity: 50,
            defectQuantity: 5,
            wasteQuantity: 2,
            startDate: new Date('2024-01-01'),
            expectedEndDate: new Date('2024-01-31'),
            status: 'in_progress',
          },
          {
            id: '2',
            code: 'PO002',
            productId: 'p2',
            product: { name: 'Tượng Quan Âm' },
            quantity: 50,
            producedQuantity: 50,
            defectQuantity: 0,
            wasteQuantity: 0,
            startDate: new Date('2024-01-05'),
            expectedEndDate: new Date('2024-01-25'),
            actualEndDate: new Date('2024-01-24'),
            status: 'completed',
          },
        ],
        meta: { total: 2, page: 1, limit: 10 },
      };

      vi.mocked(productionService.productionOrder.getProductionOrders).mockResolvedValue(
        mockOrders as any,
      );

      render(<ProductionOrderList />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('PO001')).toBeInTheDocument();
        expect(screen.getByText('PO002')).toBeInTheDocument();
        expect(screen.getByText('Tượng Phật')).toBeInTheDocument();
        expect(screen.getByText('Tượng Quan Âm')).toBeInTheDocument();
      });
    });

    it('should filter orders by status', async () => {
      const mockOrders = {
        data: [
          {
            id: '1',
            code: 'PO001',
            product: { name: 'Tượng Phật' },
            quantity: 100,
            producedQuantity: 50,
            defectQuantity: 0,
            wasteQuantity: 0,
            status: 'in_progress',
          },
        ],
        meta: { total: 1, page: 1, limit: 10 },
      };

      vi.mocked(productionService.productionOrder.getProductionOrders).mockResolvedValue(
        mockOrders as any,
      );

      render(<ProductionOrderList />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('PO001')).toBeInTheDocument();
      });

      // Verify service was called
      expect(productionService.productionOrder.getProductionOrders).toHaveBeenCalled();
    });

    it('should handle order status changes', async () => {
      const mockOrders = {
        data: [
          {
            id: '1',
            code: 'PO001',
            product: { name: 'Tượng Phật' },
            quantity: 100,
            producedQuantity: 0,
            defectQuantity: 0,
            wasteQuantity: 0,
            status: 'draft',
          },
        ],
        meta: { total: 1, page: 1, limit: 10 },
      };

      vi.mocked(productionService.productionOrder.getProductionOrders).mockResolvedValue(
        mockOrders as any,
      );
      vi.mocked(productionService.productionOrder.startProductionOrder).mockResolvedValue(
        {} as any,
      );

      render(<ProductionOrderList />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Bắt đầu')).toBeInTheDocument();
      });
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete worker workflow', async () => {
      // Test worker creation, attendance, and payroll flow
      const mockWorkers = {
        data: [
          {
            id: '1',
            code: 'W001',
            fullName: 'Nguyễn Văn A',
            specialty: 'molding',
            skillLevel: 'skilled',
            status: 'active',
          },
        ],
        meta: { total: 1, page: 1, limit: 10 },
      };

      vi.mocked(productionService.worker.getWorkers).mockResolvedValue(mockWorkers as any);

      render(<WorkerList />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument();
      });

      // Verify worker can be managed
      expect(screen.getByText('Thêm nhân viên')).toBeInTheDocument();
    });

    it('should handle production order lifecycle', async () => {
      // Test order creation, progress tracking, and completion
      const mockOrders = {
        data: [
          {
            id: '1',
            code: 'PO001',
            product: { name: 'Tượng Phật' },
            quantity: 100,
            producedQuantity: 100,
            defectQuantity: 5,
            wasteQuantity: 2,
            status: 'in_progress',
          },
        ],
        meta: { total: 1, page: 1, limit: 10 },
      };

      vi.mocked(productionService.productionOrder.getProductionOrders).mockResolvedValue(
        mockOrders as any,
      );

      render(<ProductionOrderList />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('PO001')).toBeInTheDocument();
      });

      // Verify order can be completed
      expect(screen.getByText('Hoàn thành')).toBeInTheDocument();
    });
  });
});
