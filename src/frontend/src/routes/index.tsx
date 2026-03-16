/**
 * Application Routes
 * Centralized route definitions for the application
 */

import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Spin } from 'antd';
import MainLayout from '@/components/layout/MainLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { RootState } from '@/store';

// Eager load critical pages
import LoginPage from '@/pages/auth/LoginPage';
import Dashboard from '@/pages/Dashboard';
import LandingPage from '@/pages/public/LandingPage';
import RegisterPage from '@/pages/public/RegisterPage';

// Lazy load feature pages (Requirement 22.10, 24.4)
const ProductList = lazy(() => import('@/pages/products/ProductList'));
const ProductForm = lazy(() => import('@/pages/products/ProductForm'));
const CategoryManagement = lazy(() => import('@/pages/products/CategoryManagement'));
const StockList = lazy(() => import('@/pages/inventory/StockList'));
const StockReceiptList = lazy(() => import('@/pages/inventory/StockReceiptList'));
const StockReceiptForm = lazy(() => import('@/pages/inventory/StockReceiptForm'));
const CustomerList = lazy(() => import('@/pages/customers/CustomerList'));
const CustomerForm = lazy(() => import('@/pages/customers/CustomerForm'));
const SupplierList = lazy(() => import('@/pages/suppliers/SupplierList'));
const SupplierForm = lazy(() => import('@/pages/suppliers/SupplierForm'));
const SalesOrderList = lazy(() => import('@/pages/orders/SalesOrderList'));
const SalesOrderForm = lazy(() => import('@/pages/orders/SalesOrderForm'));
const PurchaseOrderList = lazy(() => import('@/pages/orders/PurchaseOrderList'));
const PurchaseOrderForm = lazy(() => import('@/pages/orders/PurchaseOrderForm'));
const ReportsPage = lazy(() => import('@/pages/reports/ReportsPage'));
const WarehouseList = lazy(() => import('@/pages/warehouses/WarehouseList'));
const WarehouseForm = lazy(() => import('@/pages/warehouses/WarehouseForm'));
const WarehouseStockReport = lazy(() => import('@/pages/warehouses/WarehouseStockReport'));
const PrintSettings = lazy(() => import('@/pages/settings/PrintSettings'));
const SettingsPage = lazy(() => import('@/pages/settings/SettingsPage'));
const AuditLogPage = lazy(() => import('@/pages/audit/AuditLogPage'));
const NotificationCenter = lazy(() => import('@/pages/notifications/NotificationCenter'));
const InvoiceList = lazy(() => import('@/pages/invoices/InvoiceList'));
const InvoiceForm = lazy(() => import('@/pages/invoices/InvoiceForm'));
const PaymentList = lazy(() => import('@/pages/payments/PaymentList'));
const PaymentForm = lazy(() => import('@/pages/payments/PaymentForm'));
const UserList = lazy(() => import('@/pages/users/UserList'));
const UserForm = lazy(() => import('@/pages/users/UserForm'));
const NotificationListPage = lazy(() => import('@/pages/notifications/NotificationListPage'));
const NotificationPreferencesPage = lazy(() => import('@/pages/notifications/NotificationPreferencesPage'));
const SearchResultsPage = lazy(() => import('@/pages/search/SearchResultsPage'));
const TenantManagement = lazy(() => import('@/pages/tenancy/TenantManagement'));
const OfflineDemo = lazy(() => import('@/pages/OfflineDemo'));

/**
 * Loading fallback component
 */
const PageLoader = () => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
    }}
  >
    <Spin size="large" tip="Loading..." />
  </div>
);

/**
 * Lazy route wrapper with Suspense
 */
const LazyRoute = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<PageLoader />}>{children}</Suspense>
);

/**
 * Application routes component
 */
export function AppRoutes() {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LandingPage />}
      />
      <Route
        path="/register"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />}
      />
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />}
      />

      {/* Protected routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="" element={<Dashboard />} />

        {/* Products */}
        <Route path="products" element={<LazyRoute><ProductList /></LazyRoute>} />
        <Route path="products/categories" element={<LazyRoute><CategoryManagement /></LazyRoute>} />
        <Route path="products/new" element={<LazyRoute><ProductForm /></LazyRoute>} />
        <Route path="products/:id" element={<LazyRoute><ProductForm /></LazyRoute>} />

        {/* Inventory */}
        <Route path="inventory/stock" element={<LazyRoute><StockList /></LazyRoute>} />
        <Route path="inventory/receipts" element={<LazyRoute><StockReceiptList /></LazyRoute>} />
        <Route path="inventory/receipts/new" element={<LazyRoute><StockReceiptForm /></LazyRoute>} />
        <Route path="inventory/receipts/:id" element={<LazyRoute><StockReceiptForm /></LazyRoute>} />
        <Route path="inventory/low-stock" element={<LazyRoute><StockList /></LazyRoute>} />

        {/* Customers */}
        <Route path="customers" element={<LazyRoute><CustomerList /></LazyRoute>} />
        <Route path="customers/new" element={<LazyRoute><CustomerForm /></LazyRoute>} />
        <Route path="customers/:id" element={<LazyRoute><CustomerForm /></LazyRoute>} />

        {/* Suppliers */}
        <Route path="suppliers" element={<LazyRoute><SupplierList /></LazyRoute>} />
        <Route path="suppliers/new" element={<LazyRoute><SupplierForm /></LazyRoute>} />
        <Route path="suppliers/:id" element={<LazyRoute><SupplierForm /></LazyRoute>} />

        {/* Orders */}
        <Route path="orders/sales" element={<LazyRoute><SalesOrderList /></LazyRoute>} />
        <Route path="orders/sales/new" element={<LazyRoute><SalesOrderForm /></LazyRoute>} />
        <Route path="orders/sales/:id" element={<LazyRoute><SalesOrderForm /></LazyRoute>} />
        <Route path="orders/sales/:id/edit" element={<LazyRoute><SalesOrderForm /></LazyRoute>} />
        <Route path="orders/purchase" element={<LazyRoute><PurchaseOrderList /></LazyRoute>} />
        <Route path="orders/purchase/new" element={<LazyRoute><PurchaseOrderForm /></LazyRoute>} />
        <Route path="orders/purchase/:id" element={<LazyRoute><PurchaseOrderForm /></LazyRoute>} />
        <Route path="orders/purchase/:id/edit" element={<LazyRoute><PurchaseOrderForm /></LazyRoute>} />

        {/* Reports */}
        <Route path="reports" element={<LazyRoute><ReportsPage /></LazyRoute>} />

        {/* Warehouses (Requirements: 27.1, 27.3, 27.4) */}
        <Route path="warehouses" element={<LazyRoute><WarehouseList /></LazyRoute>} />
        <Route path="warehouses/list" element={<LazyRoute><WarehouseList /></LazyRoute>} />
        <Route path="warehouses/transfers" element={<LazyRoute><WarehouseList /></LazyRoute>} />
        <Route path="warehouses/new" element={<LazyRoute><WarehouseForm /></LazyRoute>} />
        <Route path="warehouses/:id" element={<LazyRoute><WarehouseForm /></LazyRoute>} />
        <Route path="warehouses/stock-report" element={<LazyRoute><WarehouseStockReport /></LazyRoute>} />

        {/* Settings */}
        <Route path="settings/print" element={<LazyRoute><PrintSettings /></LazyRoute>} />
        <Route path="settings" element={<LazyRoute><SettingsPage /></LazyRoute>} />

        {/* Audit */}
        <Route path="audit" element={<LazyRoute><AuditLogPage /></LazyRoute>} />

        {/* Notifications */}
        <Route path="notifications/center" element={<LazyRoute><NotificationCenter /></LazyRoute>} />
        <Route path="notifications" element={<LazyRoute><NotificationListPage /></LazyRoute>} />
        <Route path="notifications/list" element={<LazyRoute><NotificationListPage /></LazyRoute>} />
        <Route path="notifications/preferences" element={<LazyRoute><NotificationPreferencesPage /></LazyRoute>} />

        {/* Invoices */}
        <Route path="invoices" element={<LazyRoute><InvoiceList /></LazyRoute>} />
        <Route path="invoices/new" element={<LazyRoute><InvoiceForm /></LazyRoute>} />
        <Route path="invoices/:id" element={<LazyRoute><InvoiceForm /></LazyRoute>} />

        {/* Payments */}
        <Route path="payments" element={<LazyRoute><PaymentList /></LazyRoute>} />
        <Route path="payments/new" element={<LazyRoute><PaymentForm /></LazyRoute>} />
        <Route path="payments/:id" element={<LazyRoute><PaymentForm /></LazyRoute>} />

        {/* Users */}
        <Route path="users" element={<LazyRoute><UserList /></LazyRoute>} />
        <Route path="users/new" element={<LazyRoute><UserForm /></LazyRoute>} />
        <Route path="users/:id" element={<LazyRoute><UserForm /></LazyRoute>} />

        {/* Search (Requirements: 16, 58) */}
        <Route path="search" element={<LazyRoute><SearchResultsPage /></LazyRoute>} />

        {/* Tenancy (Requirements: 43) */}
        <Route path="tenancy" element={<LazyRoute><TenantManagement /></LazyRoute>} />

        {/* Offline Demo */}
        <Route path="offline-demo" element={<LazyRoute><OfflineDemo /></LazyRoute>} />
      </Route>
    </Routes>
  );
}

export default AppRoutes;
