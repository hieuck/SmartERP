/**
 * Application Routes
 * Centralized route definitions for the application
 */

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import MainLayout from '@/components/layout/MainLayout';
import { RootState } from '@/store';
import { Spin } from 'antd';
import { lazy, Suspense } from 'react';
import { useSelector } from 'react-redux';
import { Navigate, Route, Routes } from 'react-router-dom';

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
const AttendanceList = lazy(() => import('@/pages/hr/AttendanceList'));
const SystemSettingsPage = lazy(() => import('@/pages/settings/SystemSettingsPage'));
const NotificationCenter = lazy(() => import('@/pages/notifications/NotificationCenter'));
const InvoiceList = lazy(() => import('@/pages/invoices/InvoiceList'));
const InvoiceForm = lazy(() => import('@/pages/invoices/InvoiceForm'));
const PaymentList = lazy(() => import('@/pages/payments/PaymentList'));
const PaymentForm = lazy(() => import('@/pages/payments/PaymentForm'));
const UserList = lazy(() => import('@/pages/users/UserList'));
const UserForm = lazy(() => import('@/pages/users/UserForm'));
const NotificationListPage = lazy(() => import('@/pages/notifications/NotificationListPage'));
const NotificationPreferencesPage = lazy(
  () => import('@/pages/notifications/NotificationPreferencesPage'),
);
const SearchResultsPage = lazy(() => import('@/pages/search/SearchResultsPage'));
const TenantManagement = lazy(() => import('@/pages/tenancy/TenantManagement'));
const OfflineDemo = lazy(() => import('@/pages/OfflineDemo'));

// HR
const EmployeeList = lazy(() => import('@/pages/hr/EmployeeList'));
const EmployeeForm = lazy(() => import('@/pages/hr/EmployeeForm'));
const LeaveList = lazy(() => import('@/pages/hr/LeaveList'));
const LeaveForm = lazy(() => import('@/pages/hr/LeaveForm'));
const PayrollList = lazy(() => import('@/pages/hr/PayrollList'));

// Project Management
const ProjectList = lazy(() => import('@/pages/project/ProjectList'));
const ProjectForm = lazy(() => import('@/pages/project/ProjectForm'));

// Accounting
const ChartOfAccounts = lazy(() => import('@/pages/accounting/ChartOfAccounts'));
const JournalEntryList = lazy(() => import('@/pages/accounting/JournalEntryList'));
const AccountForm = lazy(() => import('@/pages/accounting/AccountForm'));

// Project Tasks
const TaskList = lazy(() => import('@/pages/project/TaskList'));

// Ecommerce
const ProductCatalogList = lazy(() => import('@/pages/ecommerce/ProductCatalogList'));
const ProductCatalogForm = lazy(() => import('@/pages/ecommerce/ProductCatalogForm'));
const EcommerceOrderList = lazy(() => import('@/pages/ecommerce/EcommerceOrderList'));

// Production / Manufacturing
const WorkOrderList = lazy(() => import('@/pages/production/WorkOrderList'));
const WorkOrderForm = lazy(() => import('@/pages/production/WorkOrderForm'));
const BOMList = lazy(() => import('@/pages/production/BOMList'));
const BOMForm = lazy(() => import('@/pages/production/BOMForm'));
const WorkCenterList = lazy(() => import('@/pages/production/WorkCenterList'));
const WorkCenterForm = lazy(() => import('@/pages/production/WorkCenterForm'));

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
    <Spin size="large" description="Loading..." />
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
        <Route
          path="products"
          element={
            <LazyRoute>
              <ProductList />
            </LazyRoute>
          }
        />
        <Route
          path="products/categories"
          element={
            <LazyRoute>
              <CategoryManagement />
            </LazyRoute>
          }
        />
        <Route
          path="products/new"
          element={
            <LazyRoute>
              <ProductForm />
            </LazyRoute>
          }
        />
        <Route
          path="products/:id"
          element={
            <LazyRoute>
              <ProductForm />
            </LazyRoute>
          }
        />

        {/* Inventory — /inventory redirects to stock list; also supports bare /inventory path */}
        <Route
          path="inventory"
          element={
            <LazyRoute>
              <StockList />
            </LazyRoute>
          }
        />
        <Route
          path="inventory/stock"
          element={
            <LazyRoute>
              <StockList />
            </LazyRoute>
          }
        />
        <Route
          path="inventory/receipts"
          element={
            <LazyRoute>
              <StockReceiptList />
            </LazyRoute>
          }
        />
        <Route
          path="inventory/receipts/new"
          element={
            <LazyRoute>
              <StockReceiptForm />
            </LazyRoute>
          }
        />
        <Route
          path="inventory/receipts/:id"
          element={
            <LazyRoute>
              <StockReceiptForm />
            </LazyRoute>
          }
        />
        <Route
          path="inventory/low-stock"
          element={
            <LazyRoute>
              <StockList />
            </LazyRoute>
          }
        />

        {/* Customers */}
        <Route
          path="customers"
          element={
            <LazyRoute>
              <CustomerList />
            </LazyRoute>
          }
        />
        <Route
          path="customers/new"
          element={
            <LazyRoute>
              <CustomerForm />
            </LazyRoute>
          }
        />
        <Route
          path="customers/:id"
          element={
            <LazyRoute>
              <CustomerForm />
            </LazyRoute>
          }
        />

        {/* Suppliers — also accessible under purchasing/ prefix */}
        <Route
          path="suppliers"
          element={
            <LazyRoute>
              <SupplierList />
            </LazyRoute>
          }
        />
        <Route
          path="suppliers/new"
          element={
            <LazyRoute>
              <SupplierForm />
            </LazyRoute>
          }
        />
        <Route
          path="suppliers/:id"
          element={
            <LazyRoute>
              <SupplierForm />
            </LazyRoute>
          }
        />
        <Route
          path="purchasing/suppliers"
          element={
            <LazyRoute>
              <SupplierList />
            </LazyRoute>
          }
        />
        <Route
          path="purchasing/suppliers/new"
          element={
            <LazyRoute>
              <SupplierForm />
            </LazyRoute>
          }
        />
        <Route
          path="purchasing/suppliers/:id"
          element={
            <LazyRoute>
              <SupplierForm />
            </LazyRoute>
          }
        />

        {/* Orders */}
        <Route
          path="orders/sales"
          element={
            <LazyRoute>
              <SalesOrderList />
            </LazyRoute>
          }
        />
        <Route
          path="orders/sales/new"
          element={
            <LazyRoute>
              <SalesOrderForm />
            </LazyRoute>
          }
        />
        <Route
          path="orders/sales/:id"
          element={
            <LazyRoute>
              <SalesOrderForm />
            </LazyRoute>
          }
        />
        <Route
          path="orders/sales/:id/edit"
          element={
            <LazyRoute>
              <SalesOrderForm />
            </LazyRoute>
          }
        />
        <Route
          path="orders/purchase"
          element={
            <LazyRoute>
              <PurchaseOrderList />
            </LazyRoute>
          }
        />
        <Route
          path="orders/purchase/new"
          element={
            <LazyRoute>
              <PurchaseOrderForm />
            </LazyRoute>
          }
        />
        <Route
          path="orders/purchase/:id"
          element={
            <LazyRoute>
              <PurchaseOrderForm />
            </LazyRoute>
          }
        />
        <Route
          path="orders/purchase/:id/edit"
          element={
            <LazyRoute>
              <PurchaseOrderForm />
            </LazyRoute>
          }
        />

        {/* Reports */}
        <Route
          path="reports"
          element={
            <LazyRoute>
              <ReportsPage />
            </LazyRoute>
          }
        />

        {/* Warehouses (Requirements: 27.1, 27.3, 27.4) */}
        <Route
          path="warehouses"
          element={
            <LazyRoute>
              <WarehouseList />
            </LazyRoute>
          }
        />
        <Route
          path="warehouses/list"
          element={
            <LazyRoute>
              <WarehouseList />
            </LazyRoute>
          }
        />
        <Route
          path="warehouses/transfers"
          element={
            <LazyRoute>
              <WarehouseList />
            </LazyRoute>
          }
        />
        <Route
          path="warehouses/new"
          element={
            <LazyRoute>
              <WarehouseForm />
            </LazyRoute>
          }
        />
        <Route
          path="warehouses/:id"
          element={
            <LazyRoute>
              <WarehouseForm />
            </LazyRoute>
          }
        />
        <Route
          path="warehouses/stock-report"
          element={
            <LazyRoute>
              <WarehouseStockReport />
            </LazyRoute>
          }
        />

        {/* Settings */}
        <Route
          path="settings/system"
          element={
            <LazyRoute>
              <SystemSettingsPage />
            </LazyRoute>
          }
        />
        <Route
          path="settings/print"
          element={
            <LazyRoute>
              <PrintSettings />
            </LazyRoute>
          }
        />
        <Route
          path="settings"
          element={
            <LazyRoute>
              <SettingsPage />
            </LazyRoute>
          }
        />

        {/* Audit */}
        <Route
          path="audit"
          element={
            <LazyRoute>
              <AuditLogPage />
            </LazyRoute>
          }
        />

        {/* HR */}
        <Route
          path="hr/attendance"
          element={
            <LazyRoute>
              <AttendanceList />
            </LazyRoute>
          }
        />
        <Route
          path="hr/employees"
          element={
            <LazyRoute>
              <EmployeeList />
            </LazyRoute>
          }
        />
        <Route
          path="hr/employees/new"
          element={
            <LazyRoute>
              <EmployeeForm />
            </LazyRoute>
          }
        />
        <Route
          path="hr/employees/:id"
          element={
            <LazyRoute>
              <EmployeeForm />
            </LazyRoute>
          }
        />
        <Route
          path="hr/leave"
          element={
            <LazyRoute>
              <LeaveList />
            </LazyRoute>
          }
        />
        <Route
          path="hr/leave/new"
          element={
            <LazyRoute>
              <LeaveForm />
            </LazyRoute>
          }
        />
        <Route
          path="hr/payroll"
          element={
            <LazyRoute>
              <PayrollList />
            </LazyRoute>
          }
        />

        {/* Project Management */}
        <Route
          path="projects"
          element={
            <LazyRoute>
              <ProjectList />
            </LazyRoute>
          }
        />
        <Route
          path="projects/new"
          element={
            <LazyRoute>
              <ProjectForm />
            </LazyRoute>
          }
        />
        <Route
          path="projects/:id"
          element={
            <LazyRoute>
              <ProjectForm />
            </LazyRoute>
          }
        />
        <Route
          path="projects/:id/tasks"
          element={
            <LazyRoute>
              <TaskList />
            </LazyRoute>
          }
        />

        {/* Accounting */}
        <Route
          path="accounting/accounts"
          element={
            <LazyRoute>
              <ChartOfAccounts />
            </LazyRoute>
          }
        />
        <Route
          path="accounting/accounts/new"
          element={
            <LazyRoute>
              <AccountForm />
            </LazyRoute>
          }
        />
        <Route
          path="accounting/accounts/:id"
          element={
            <LazyRoute>
              <AccountForm />
            </LazyRoute>
          }
        />
        <Route
          path="accounting/journal-entries"
          element={
            <LazyRoute>
              <JournalEntryList />
            </LazyRoute>
          }
        />

        {/* Ecommerce */}
        <Route
          path="ecommerce/products"
          element={
            <LazyRoute>
              <ProductCatalogList />
            </LazyRoute>
          }
        />
        <Route
          path="ecommerce/products/new"
          element={
            <LazyRoute>
              <ProductCatalogForm />
            </LazyRoute>
          }
        />
        <Route
          path="ecommerce/products/:id"
          element={
            <LazyRoute>
              <ProductCatalogForm />
            </LazyRoute>
          }
        />
        <Route
          path="ecommerce/orders"
          element={
            <LazyRoute>
              <EcommerceOrderList />
            </LazyRoute>
          }
        />

        {/* Notifications */}
        <Route
          path="notifications/center"
          element={
            <LazyRoute>
              <NotificationCenter />
            </LazyRoute>
          }
        />
        <Route
          path="notifications"
          element={
            <LazyRoute>
              <NotificationListPage />
            </LazyRoute>
          }
        />
        <Route
          path="notifications/list"
          element={
            <LazyRoute>
              <NotificationListPage />
            </LazyRoute>
          }
        />
        <Route
          path="notifications/preferences"
          element={
            <LazyRoute>
              <NotificationPreferencesPage />
            </LazyRoute>
          }
        />

        {/* Invoices — also accessible under accounting/ prefix */}
        <Route
          path="invoices"
          element={
            <LazyRoute>
              <InvoiceList />
            </LazyRoute>
          }
        />
        <Route
          path="accounting/invoices"
          element={
            <LazyRoute>
              <InvoiceList />
            </LazyRoute>
          }
        />
        <Route
          path="invoices/new"
          element={
            <LazyRoute>
              <InvoiceForm />
            </LazyRoute>
          }
        />
        <Route
          path="invoices/:id"
          element={
            <LazyRoute>
              <InvoiceForm />
            </LazyRoute>
          }
        />

        {/* Payments — also accessible under accounting/ prefix */}
        <Route
          path="payments"
          element={
            <LazyRoute>
              <PaymentList />
            </LazyRoute>
          }
        />
        <Route
          path="accounting/payments"
          element={
            <LazyRoute>
              <PaymentList />
            </LazyRoute>
          }
        />
        <Route
          path="payments/new"
          element={
            <LazyRoute>
              <PaymentForm />
            </LazyRoute>
          }
        />
        <Route
          path="payments/:id"
          element={
            <LazyRoute>
              <PaymentForm />
            </LazyRoute>
          }
        />

        {/* Users */}
        <Route
          path="users"
          element={
            <LazyRoute>
              <UserList />
            </LazyRoute>
          }
        />
        <Route
          path="users/new"
          element={
            <LazyRoute>
              <UserForm />
            </LazyRoute>
          }
        />
        <Route
          path="users/:id"
          element={
            <LazyRoute>
              <UserForm />
            </LazyRoute>
          }
        />

        {/* Search (Requirements: 16, 58) */}
        <Route
          path="search"
          element={
            <LazyRoute>
              <SearchResultsPage />
            </LazyRoute>
          }
        />

        {/* Tenancy (Requirements: 43) */}
        <Route
          path="tenancy"
          element={
            <LazyRoute>
              <TenantManagement />
            </LazyRoute>
          }
        />

        {/* Production / Manufacturing */}
        <Route
          path="production/work-orders"
          element={
            <LazyRoute>
              <WorkOrderList />
            </LazyRoute>
          }
        />
        <Route
          path="production/work-orders/new"
          element={
            <LazyRoute>
              <WorkOrderForm />
            </LazyRoute>
          }
        />
        <Route
          path="production/work-orders/:id/edit"
          element={
            <LazyRoute>
              <WorkOrderForm />
            </LazyRoute>
          }
        />
        <Route
          path="production/bom"
          element={
            <LazyRoute>
              <BOMList />
            </LazyRoute>
          }
        />
        <Route
          path="production/bom/new"
          element={
            <LazyRoute>
              <BOMForm />
            </LazyRoute>
          }
        />
        <Route
          path="production/bom/:id/edit"
          element={
            <LazyRoute>
              <BOMForm />
            </LazyRoute>
          }
        />
        <Route
          path="production/work-centers"
          element={
            <LazyRoute>
              <WorkCenterList />
            </LazyRoute>
          }
        />
        <Route
          path="production/work-centers/new"
          element={
            <LazyRoute>
              <WorkCenterForm />
            </LazyRoute>
          }
        />
        <Route
          path="production/work-centers/:id/edit"
          element={
            <LazyRoute>
              <WorkCenterForm />
            </LazyRoute>
          }
        />

        {/* Offline Demo */}
        <Route
          path="offline-demo"
          element={
            <LazyRoute>
              <OfflineDemo />
            </LazyRoute>
          }
        />
      </Route>
    </Routes>
  );
}

export default AppRoutes;
