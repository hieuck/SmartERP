/**
 * Mock Data Fixtures
 * Reusable test data for unit, integration, and E2E tests
 */

// Auth fixtures
export const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  role: 'user',
  createdAt: '2024-01-01T00:00:00Z',
};

export const mockAuthState = {
  user: mockUser,
  token: 'mock-jwt-token',
  isAuthenticated: true,
  isLoading: false,
  error: null,
};

export const mockAuthStateUnauthenticated = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// Dashboard fixtures
export const mockDashboardMetrics = {
  totalSales: 50000,
  totalOrders: 150,
  totalCustomers: 45,
  totalProducts: 200,
  lastUpdated: new Date().toISOString(),
};

export const mockDashboardState = {
  metrics: mockDashboardMetrics,
  isLoading: false,
  error: null,
};

// Product fixtures
export const mockProduct = {
  id: 'prod-123',
  name: 'Test Product',
  sku: 'TEST-001',
  price: 99.99,
  quantity: 100,
  category: 'Electronics',
  description: 'A test product',
  image: 'https://example.com/image.jpg',
};

export const mockProducts = [
  mockProduct,
  {
    id: 'prod-124',
    name: 'Test Product 2',
    sku: 'TEST-002',
    price: 149.99,
    quantity: 50,
    category: 'Electronics',
    description: 'Another test product',
    image: 'https://example.com/image2.jpg',
  },
];

export const mockProductState = {
  products: mockProducts,
  selectedProduct: null,
  isLoading: false,
  error: null,
};

// Order fixtures
export const mockOrder = {
  id: 'order-123',
  orderNumber: 'ORD-001',
  customerId: 'cust-123',
  items: [
    {
      productId: 'prod-123',
      quantity: 2,
      price: 99.99,
    },
  ],
  total: 199.98,
  status: 'pending',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const mockOrders = [mockOrder];

export const mockOrderState = {
  orders: mockOrders,
  selectedOrder: null,
  isLoading: false,
  error: null,
};

// Inventory fixtures
export const mockInventoryItem = {
  id: 'inv-123',
  productId: 'prod-123',
  quantity: 100,
  warehouseLocation: 'A-1-1',
  lastStockCheck: new Date().toISOString(),
};

export const mockInventoryState = {
  items: [mockInventoryItem],
  isLoading: false,
  error: null,
};

// Offline state fixtures
export const mockOfflineState = {
  isOnline: true,
  pendingSyncActions: [],
  lastSyncTime: new Date().toISOString(),
};

export const mockOfflineStateDisconnected = {
  isOnline: false,
  pendingSyncActions: [
    {
      type: 'CREATE_ORDER',
      payload: mockOrder,
      timestamp: new Date().toISOString(),
    },
  ],
  lastSyncTime: new Date(Date.now() - 3600000).toISOString(),
};

// API response fixtures
export const mockApiLoginResponse = {
  token: 'mock-jwt-token',
  user: mockUser,
};

export const mockApiProductsResponse = {
  data: mockProducts,
  total: mockProducts.length,
  page: 1,
  pageSize: 10,
};

export const mockApiOrdersResponse = {
  data: mockOrders,
  total: mockOrders.length,
  page: 1,
  pageSize: 10,
};

// Error fixtures
export const mockNetworkError = {
  message: 'Network request failed',
  code: 'NETWORK_ERROR',
};

export const mockAuthError = {
  message: 'Invalid credentials',
  code: 'AUTH_ERROR',
};

export const mockValidationError = {
  message: 'Validation failed',
  code: 'VALIDATION_ERROR',
  errors: {
    email: 'Invalid email format',
    password: 'Password too short',
  },
};

// Navigation fixtures
export const mockNavigationParams = {
  productId: 'prod-123',
  orderId: 'order-123',
  customerId: 'cust-123',
};

// Barcode fixtures
export const mockBarcodeData = {
  type: 'ean13',
  data: '5901234123457',
};

// Camera fixtures
export const mockCameraPermission = {
  status: 'granted',
  canAskAgain: true,
  expires: 'never',
};

// Notification fixtures
export const mockNotification = {
  id: 'notif-123',
  title: 'Order Confirmed',
  body: 'Your order has been confirmed',
  data: {
    orderId: 'order-123',
  },
  timestamp: new Date().toISOString(),
};
