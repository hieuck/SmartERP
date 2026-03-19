import { vi } from 'vitest';

/**
 * Mock API Client
 */

export const mockApiClient = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
};

// Mock axios
vi.mock('axios', () => ({
  create: vi.fn(() => mockApiClient),
  isAxiosError: vi.fn(),
}));

// Mock API responses
export const mockApiResponses = {
  products: {
    list: {
      data: [
        {
          id: '1',
          code: 'PROD-001',
          name: 'Test Product 1',
          price: 100,
          stock: 50,
          status: 'active',
        },
        {
          id: '2',
          code: 'PROD-002',
          name: 'Test Product 2',
          price: 200,
          stock: 30,
          status: 'active',
        },
      ],
      total: 2,
      page: 1,
      limit: 10,
    },
    single: {
      id: '1',
      code: 'PROD-001',
      name: 'Test Product 1',
      description: 'Test product description',
      price: 100,
      cost: 50,
      stock: 50,
      status: 'active',
      categoryId: 'cat-1',
      tenantId: 'tenant-1',
    },
  },
  customers: {
    list: {
      data: [
        {
          id: '1',
          code: 'CUST-001',
          name: 'Test Customer 1',
          email: 'customer1@example.com',
          phone: '1234567890',
          status: 'active',
        },
        {
          id: '2',
          code: 'CUST-002',
          name: 'Test Customer 2',
          email: 'customer2@example.com',
          phone: '0987654321',
          status: 'active',
        },
      ],
      total: 2,
      page: 1,
      limit: 10,
    },
  },
  orders: {
    list: {
      data: [
        {
          id: '1',
          orderNumber: 'ORD-001',
          customerId: '1',
          customerName: 'Test Customer 1',
          total: 1000,
          status: 'pending',
          createdAt: '2024-01-01T00:00:00Z',
        },
      ],
      total: 1,
      page: 1,
      limit: 10,
    },
  },
  auth: {
    login: {
      token: 'mock-jwt-token',
      user: {
        id: 'user-1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        tenantId: 'tenant-1',
        role: 'admin',
      },
    },
  },
};

// Reset all mocks
export function resetApiMocks() {
  mockApiClient.get.mockReset();
  mockApiClient.post.mockReset();
  mockApiClient.put.mockReset();
  mockApiClient.patch.mockReset();
  mockApiClient.delete.mockReset();
}
