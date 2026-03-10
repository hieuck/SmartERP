import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../../store/slices/authSlice';
import SalesOrderForm from '../../pages/orders/SalesOrderForm';
import SalesOrderList from '../../pages/orders/SalesOrderList';
import PurchaseOrderForm from '../../pages/orders/PurchaseOrderForm';
import PurchaseOrderList from '../../pages/orders/PurchaseOrderList';
import PaymentPage from '../../pages/orders/PaymentPage';
import { orderService } from '../../services/order/orderService';
import { productService } from '../../services/inventory/productService';
import { customerService } from '../../services/crm/customerService';

// Mock services
vi.mock('../../services/orderService');
vi.mock('../../services/productService');
vi.mock('../../services/customerService');

const mockStore = configureStore({
  reducer: {
    auth: authReducer,
  },
  preloadedState: {
    auth: {
      isAuthenticated: true,
      user: { id: '1', username: 'test', email: 'test@test.com' },
      token: 'test-token',
    },
  },
});

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <Provider store={mockStore}>
      <BrowserRouter>{component}</BrowserRouter>
    </Provider>,
  );
};

describe('Sales Order Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(productService.getProducts).mockResolvedValue({
      data: [
        { id: '1', name: 'Product 1', sku: 'P001', price: 100000 },
        { id: '2', name: 'Product 2', sku: 'P002', price: 200000 },
      ],
      total: 2,
    });
    vi.mocked(customerService.getCustomers).mockResolvedValue({
      data: [
        { id: '1', name: 'Customer 1', code: 'C001' },
        { id: '2', name: 'Customer 2', code: 'C002' },
      ],
      total: 2,
    });
  });

  test('should create a new sales order', async () => {
    vi.mocked(orderService.createSalesOrder).mockResolvedValue({
      id: '1',
      code: 'SO001',
    });

    renderWithProviders(<SalesOrderForm />);

    await waitFor(() => {
      expect(screen.getByText('Tạo đơn hàng mới')).toBeInTheDocument();
    });

    // Select customer
    const customerSelect = screen.getByLabelText('Khách hàng');
    fireEvent.mouseDown(customerSelect);
    await waitFor(() => {
      const option = screen.getByText('Customer 1 - C001');
      fireEvent.click(option);
    });

    // Add product
    const addButton = screen.getByText('Thêm sản phẩm');
    fireEvent.click(addButton);

    // Submit form
    const submitButton = screen.getByText('Tạo đơn hàng');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(orderService.createSalesOrder).toHaveBeenCalled();
    });
  });

  test('should display sales order list', async () => {
    vi.mocked(orderService.getSalesOrders).mockResolvedValue({
      data: [
        {
          id: '1',
          code: 'SO001',
          customerName: 'Customer 1',
          orderDate: '2024-01-01',
          total: 500000,
          status: 'pending',
        },
      ],
      total: 1,
    });

    renderWithProviders(<SalesOrderList />);

    await waitFor(() => {
      expect(screen.getByText('SO001')).toBeInTheDocument();
      expect(screen.getByText('Customer 1')).toBeInTheDocument();
    });
  });

  test('should approve sales order', async () => {
    vi.mocked(orderService.getSalesOrders).mockResolvedValue({
      data: [
        {
          id: '1',
          code: 'SO001',
          customerName: 'Customer 1',
          orderDate: '2024-01-01',
          total: 500000,
          status: 'pending',
        },
      ],
      total: 1,
    });
    vi.mocked(orderService.approveSalesOrder).mockResolvedValue({});

    renderWithProviders(<SalesOrderList />);

    await waitFor(() => {
      const approveButton = screen.getByText('Duyệt');
      fireEvent.click(approveButton);
    });

    // Confirm modal
    await waitFor(() => {
      const confirmButton = screen.getByText('OK');
      fireEvent.click(confirmButton);
    });

    await waitFor(() => {
      expect(orderService.approveSalesOrder).toHaveBeenCalledWith('1');
    });
  });
});

describe('Purchase Order Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(productService.getProducts).mockResolvedValue({
      data: [
        { id: '1', name: 'Product 1', sku: 'P001', cost: 80000 },
        { id: '2', name: 'Product 2', sku: 'P002', cost: 150000 },
      ],
      total: 2,
    });
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({
        data: [
          { id: '1', name: 'Supplier 1', code: 'S001' },
          { id: '2', name: 'Supplier 2', code: 'S002' },
        ],
      }),
    });
  });

  test('should create a new purchase order', async () => {
    vi.mocked(orderService.createPurchaseOrder).mockResolvedValue({
      id: '1',
      code: 'PO001',
    });

    renderWithProviders(<PurchaseOrderForm />);

    await waitFor(() => {
      expect(screen.getByText('Tạo đơn mua hàng mới')).toBeInTheDocument();
    });

    // Select supplier
    const supplierSelect = screen.getByLabelText('Nhà cung cấp');
    fireEvent.mouseDown(supplierSelect);
    await waitFor(() => {
      const option = screen.getByText('Supplier 1 - S001');
      fireEvent.click(option);
    });

    // Add product
    const addButton = screen.getByText('Thêm sản phẩm');
    fireEvent.click(addButton);

    // Submit form
    const submitButton = screen.getByText('Tạo đơn mua hàng');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(orderService.createPurchaseOrder).toHaveBeenCalled();
    });
  });

  test('should display purchase order list', async () => {
    vi.mocked(orderService.getPurchaseOrders).mockResolvedValue({
      data: [
        {
          id: '1',
          code: 'PO001',
          supplierName: 'Supplier 1',
          orderDate: '2024-01-01',
          total: 800000,
          status: 'pending',
        },
      ],
      total: 1,
    });

    renderWithProviders(<PurchaseOrderList />);

    await waitFor(() => {
      expect(screen.getByText('PO001')).toBeInTheDocument();
      expect(screen.getByText('Supplier 1')).toBeInTheDocument();
    });
  });
});

describe('Payment Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(customerService.getCustomers).mockResolvedValue({
      data: [{ id: '1', name: 'Customer 1', code: 'C001' }],
      total: 1,
    });
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({
        data: [{ id: '1', name: 'Supplier 1', code: 'S001' }],
      }),
    });
    vi.mocked(orderService.getAccountsReceivable).mockResolvedValue([
      {
        customerId: '1',
        customerName: 'Customer 1',
        totalDebt: 1000000,
        paid: 500000,
        remaining: 500000,
      },
    ]);
    vi.mocked(orderService.getAccountsPayable).mockResolvedValue([
      {
        supplierId: '1',
        supplierName: 'Supplier 1',
        totalDebt: 800000,
        paid: 300000,
        remaining: 500000,
      },
    ]);
    vi.mocked(orderService.getPayments).mockResolvedValue([]);
  });

  test('should record payment from customer', async () => {
    vi.mocked(orderService.recordPayment).mockResolvedValue({});

    renderWithProviders(<PaymentPage />);

    await waitFor(() => {
      expect(screen.getByText('Ghi nhận thanh toán')).toBeInTheDocument();
    });

    // Select customer
    const customerSelect = screen.getByLabelText('Khách hàng');
    fireEvent.mouseDown(customerSelect);
    await waitFor(() => {
      const option = screen.getByText('Customer 1 - C001');
      fireEvent.click(option);
    });

    // Enter amount
    const amountInput = screen.getByLabelText('Số tiền');
    fireEvent.change(amountInput, { target: { value: '500000' } });

    // Submit
    const submitButton = screen.getByText('Ghi nhận thu tiền');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(orderService.recordPayment).toHaveBeenCalledWith(
        expect.objectContaining({
          customerId: '1',
          amount: 500000,
          type: 'receipt',
        }),
      );
    });
  });

  test('should display accounts receivable', async () => {
    renderWithProviders(<PaymentPage />);

    await waitFor(() => {
      expect(screen.getByText('Customer 1')).toBeInTheDocument();
      expect(screen.getByText('1,000,000 đ')).toBeInTheDocument();
    });
  });

  test('should display accounts payable', async () => {
    renderWithProviders(<PaymentPage />);

    await waitFor(() => {
      expect(screen.getByText('Supplier 1')).toBeInTheDocument();
      expect(screen.getByText('800,000 đ')).toBeInTheDocument();
    });
  });
});
