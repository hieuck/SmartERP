// API Configuration
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

// App Configuration
export const APP_NAME = 'SmartERP Mobile';
export const APP_VERSION = '1.0.0';

// Storage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER_DATA: 'userData',
  BIOMETRIC_ENABLED: 'biometricEnabled',
  THEME: 'theme',
  LANGUAGE: 'language',
};

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    PROFILE: '/auth/profile',
    CHANGE_PASSWORD: '/auth/change-password',
  },
  PRODUCTS: {
    LIST: '/products',
    DETAIL: (id: string) => `/products/${id}`,
    CREATE: '/products',
    UPDATE: (id: string) => `/products/${id}`,
    DELETE: (id: string) => `/products/${id}`,
  },
  INVENTORY: {
    STOCK: '/inventory/stock',
    RECEIPTS: '/inventory/receipts',
    ISSUES: '/inventory/issues',
  },
  ORDERS: {
    LIST: '/orders/sales',
    DETAIL: (id: string) => `/orders/sales/${id}`,
    CREATE: '/orders/sales',
    UPDATE: (id: string) => `/orders/sales/${id}`,
  },
};
