import { Spin } from 'antd';
import { lazy, Suspense } from 'react';
import { useSelector } from 'react-redux';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import { useInactivityLogout } from './hooks/useInactivityLogout';
import { RootState } from './store';

// Eager load critical pages
import LoginPage from './pages/auth/LoginPage';
import Dashboard from './pages/Dashboard';
import LandingPage from './pages/public/LandingPage';
import RegisterPage from './pages/public/RegisterPage';

// Lazy load feature pages (Requirement 22.10, 24.4)
const ProductList = lazy(() => import('./pages/products/ProductList'));
const ProductForm = lazy(() => import('./pages/products/ProductForm'));
const CategoryManagement = lazy(() => import('./pages/products/CategoryManagement'));
const StockList = lazy(() => import('./pages/inventory/StockList'));
const StockReceiptList = lazy(() => import('./pages/inventory/StockReceiptList'));
const StockReceiptForm = lazy(() => import('./pages/inventory/StockReceiptForm'));
const StockIssueList = lazy(() => import('./pages/inventory/StockIssueList'));
const StockIssueForm = lazy(() => import('./pages/inventory/StockIssueForm'));
const CustomerList = lazy(() => import('./pages/customers/CustomerList'));
const CustomerForm = lazy(() => import('./pages/customers/CustomerForm'));
const SupplierList = lazy(() => import('./pages/suppliers/SupplierList'));
const SupplierForm = lazy(() => import('./pages/suppliers/SupplierForm'));
const SalesOrderList = lazy(() => import('./pages/orders/SalesOrderList'));
const SalesOrderForm = lazy(() => import('./pages/orders/SalesOrderForm'));
const PurchaseOrderList = lazy(() => import('./pages/orders/PurchaseOrderList'));
const PurchaseOrderForm = lazy(() => import('./pages/orders/PurchaseOrderForm'));
const PaymentPage = lazy(() => import('./pages/orders/PaymentPage'));
const ReportsPage = lazy(() => import('./pages/reports/ReportsPage'));
// Warehouse pages (Requirements: 27.1, 27.3, 27.4)
const WarehouseList = lazy(() => import('./pages/warehouses/WarehouseList'));
const WarehouseForm = lazy(() => import('./pages/warehouses/WarehouseForm'));
// Warehouse pages (continued)
const StockTransferList = lazy(() => import('./pages/warehouses/StockTransferList'));
const StockTransferForm = lazy(() => import('./pages/warehouses/StockTransferForm'));
const WarehouseStockReport = lazy(() => import('./pages/warehouses/WarehouseStockReport'));
// Settings pages
const PrintSettings = lazy(() => import('./pages/settings/PrintSettings'));
const SettingsPage = lazy(() => import('./pages/settings/SettingsPage'));
// Audit pages
const AuditLogPage = lazy(() => import('./pages/audit/AuditLogPage'));
// Notification pages
const NotificationCenter = lazy(() => import('./pages/notifications/NotificationCenter'));
// Invoice & Payment pages
const InvoiceList = lazy(() => import('./pages/invoices/InvoiceList'));
const InvoiceForm = lazy(() => import('./pages/invoices/InvoiceForm'));
const PaymentList = lazy(() => import('./pages/payments/PaymentList'));
const PaymentForm = lazy(() => import('./pages/payments/PaymentForm'));
// User management pages
const UserList = lazy(() => import('./pages/users/UserList'));
const UserForm = lazy(() => import('./pages/users/UserForm'));
// Production pages (Requirements: 31-42)
const WorkerList = lazy(() => import('./pages/production/WorkerList'));
const WorkerForm = lazy(() => import('./pages/production/WorkerForm'));
const AttendanceTracking = lazy(() => import('./pages/production/AttendanceTracking'));
const ShiftCalendar = lazy(() => import('./pages/production/ShiftCalendar'));
const PayrollList = lazy(() => import('./pages/production/PayrollList'));
const AdvancePaymentList = lazy(() => import('./pages/production/AdvancePaymentList'));
const MaterialList = lazy(() => import('./pages/production/MaterialList'));
const MaterialForm = lazy(() => import('./pages/production/MaterialForm'));
const MaterialTransactions = lazy(() => import('./pages/production/MaterialTransactions'));
const MoldList = lazy(() => import('./pages/production/MoldList'));
const MoldForm = lazy(() => import('./pages/production/MoldForm'));
const MoldMaintenance = lazy(() => import('./pages/production/MoldMaintenance'));
const ProductionOrderList = lazy(() => import('./pages/production/ProductionOrderList'));
const ProductionOrderDetail = lazy(() => import('./pages/production/ProductionOrderDetail'));
const ProductionReports = lazy(() => import('./pages/production/ProductionReports'));
const PieceworkTracking = lazy(() => import('./pages/production/PieceworkTracking'));
// Promotions pages (Requirements: 28)
const PromotionsPage = lazy(() => import('./pages/promotions/PromotionsPage'));
// Notifications pages (Requirements: 18)
const NotificationListPage = lazy(() => import('./pages/notifications/NotificationListPage'));
const NotificationPreferencesPage = lazy(
  () => import('./pages/notifications/NotificationPreferencesPage'),
);
// Search pages (Requirements: 16, 58)
const SearchResultsPage = lazy(() => import('./pages/search/SearchResultsPage'));
// Tenancy pages (Requirements: 43)
const TenantManagement = lazy(() => import('./pages/tenancy/TenantManagement'));
// Offline demo page
const OfflineDemo = lazy(() => import('./pages/OfflineDemo'));

// Loading fallback component
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

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  // Enable auto-logout after 30 minutes of inactivity (Requirement 23.3)
  useInactivityLogout();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function App() {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  return (
    <BrowserRouter>
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

          {/* Products - Lazy loaded */}
          <Route
            path="products"
            element={
              <Suspense fallback={<PageLoader />}>
                <ProductList />
              </Suspense>
            }
          />
          <Route
            path="products/categories"
            element={
              <Suspense fallback={<PageLoader />}>
                <CategoryManagement />
              </Suspense>
            }
          />
          <Route
            path="products/new"
            element={
              <Suspense fallback={<PageLoader />}>
                <ProductForm />
              </Suspense>
            }
          />
          <Route
            path="products/:id"
            element={
              <Suspense fallback={<PageLoader />}>
                <ProductForm />
              </Suspense>
            }
          />

          {/* Inventory - Lazy loaded */}
          <Route
            path="inventory/stock"
            element={
              <Suspense fallback={<PageLoader />}>
                <StockList />
              </Suspense>
            }
          />
          <Route
            path="inventory/receipts"
            element={
              <Suspense fallback={<PageLoader />}>
                <StockReceiptList />
              </Suspense>
            }
          />
          <Route
            path="inventory/receipts/new"
            element={
              <Suspense fallback={<PageLoader />}>
                <StockReceiptForm />
              </Suspense>
            }
          />
          <Route
            path="inventory/receipts/:id"
            element={
              <Suspense fallback={<PageLoader />}>
                <StockReceiptForm />
              </Suspense>
            }
          />
          <Route
            path="inventory/issues"
            element={
              <Suspense fallback={<PageLoader />}>
                <StockIssueList />
              </Suspense>
            }
          />
          <Route
            path="inventory/issues/new"
            element={
              <Suspense fallback={<PageLoader />}>
                <StockIssueForm />
              </Suspense>
            }
          />
          <Route
            path="inventory/issues/:id"
            element={
              <Suspense fallback={<PageLoader />}>
                <StockIssueForm />
              </Suspense>
            }
          />

          {/* Customers - Lazy loaded */}
          <Route
            path="customers"
            element={
              <Suspense fallback={<PageLoader />}>
                <CustomerList />
              </Suspense>
            }
          />
          <Route
            path="customers/new"
            element={
              <Suspense fallback={<PageLoader />}>
                <CustomerForm />
              </Suspense>
            }
          />
          <Route
            path="customers/:id"
            element={
              <Suspense fallback={<PageLoader />}>
                <CustomerForm />
              </Suspense>
            }
          />

          {/* Suppliers - Lazy loaded */}
          <Route
            path="suppliers"
            element={
              <Suspense fallback={<PageLoader />}>
                <SupplierList />
              </Suspense>
            }
          />
          <Route
            path="suppliers/new"
            element={
              <Suspense fallback={<PageLoader />}>
                <SupplierForm />
              </Suspense>
            }
          />
          <Route
            path="suppliers/:id"
            element={
              <Suspense fallback={<PageLoader />}>
                <SupplierForm />
              </Suspense>
            }
          />

          {/* Orders - Lazy loaded */}
          <Route
            path="orders/sales"
            element={
              <Suspense fallback={<PageLoader />}>
                <SalesOrderList />
              </Suspense>
            }
          />
          <Route
            path="orders/sales/new"
            element={
              <Suspense fallback={<PageLoader />}>
                <SalesOrderForm />
              </Suspense>
            }
          />
          <Route
            path="orders/sales/:id"
            element={
              <Suspense fallback={<PageLoader />}>
                <SalesOrderForm />
              </Suspense>
            }
          />
          <Route
            path="orders/sales/:id/edit"
            element={
              <Suspense fallback={<PageLoader />}>
                <SalesOrderForm />
              </Suspense>
            }
          />
          <Route
            path="orders/purchase"
            element={
              <Suspense fallback={<PageLoader />}>
                <PurchaseOrderList />
              </Suspense>
            }
          />
          <Route
            path="orders/purchase/new"
            element={
              <Suspense fallback={<PageLoader />}>
                <PurchaseOrderForm />
              </Suspense>
            }
          />
          <Route
            path="orders/purchase/:id"
            element={
              <Suspense fallback={<PageLoader />}>
                <PurchaseOrderForm />
              </Suspense>
            }
          />
          <Route
            path="orders/purchase/:id/edit"
            element={
              <Suspense fallback={<PageLoader />}>
                <PurchaseOrderForm />
              </Suspense>
            }
          />
          <Route
            path="orders/payments"
            element={
              <Suspense fallback={<PageLoader />}>
                <PaymentPage />
              </Suspense>
            }
          />

          {/* Reports - Lazy loaded */}
          <Route
            path="reports"
            element={
              <Suspense fallback={<PageLoader />}>
                <ReportsPage />
              </Suspense>
            }
          />

          {/* Warehouses - Lazy loaded (Requirements: 27.1, 27.3, 27.4) */}
          <Route
            path="warehouses"
            element={
              <Suspense fallback={<PageLoader />}>
                <WarehouseList />
              </Suspense>
            }
          />
          <Route
            path="warehouses/new"
            element={
              <Suspense fallback={<PageLoader />}>
                <WarehouseForm />
              </Suspense>
            }
          />
          <Route
            path="warehouses/:id"
            element={
              <Suspense fallback={<PageLoader />}>
                <WarehouseForm />
              </Suspense>
            }
          />
          <Route
            path="warehouses/transfers"
            element={
              <Suspense fallback={<PageLoader />}>
                <StockTransferList />
              </Suspense>
            }
          />
          <Route
            path="warehouses/transfers/new"
            element={
              <Suspense fallback={<PageLoader />}>
                <StockTransferForm />
              </Suspense>
            }
          />
          <Route
            path="warehouses/transfers/:id"
            element={
              <Suspense fallback={<PageLoader />}>
                <StockTransferForm />
              </Suspense>
            }
          />
          <Route
            path="warehouses/stock-report"
            element={
              <Suspense fallback={<PageLoader />}>
                <WarehouseStockReport />
              </Suspense>
            }
          />

          {/* Settings - Lazy loaded */}
          <Route
            path="settings/print"
            element={
              <Suspense fallback={<PageLoader />}>
                <PrintSettings />
              </Suspense>
            }
          />
          <Route
            path="settings"
            element={
              <Suspense fallback={<PageLoader />}>
                <SettingsPage />
              </Suspense>
            }
          />

          {/* Audit - Lazy loaded */}
          <Route
            path="audit"
            element={
              <Suspense fallback={<PageLoader />}>
                <AuditLogPage />
              </Suspense>
            }
          />

          {/* Notifications - Lazy loaded */}
          <Route
            path="notifications/center"
            element={
              <Suspense fallback={<PageLoader />}>
                <NotificationCenter />
              </Suspense>
            }
          />

          {/* Invoices - Lazy loaded */}
          <Route
            path="invoices"
            element={
              <Suspense fallback={<PageLoader />}>
                <InvoiceList />
              </Suspense>
            }
          />
          <Route
            path="invoices/new"
            element={
              <Suspense fallback={<PageLoader />}>
                <InvoiceForm />
              </Suspense>
            }
          />
          <Route
            path="invoices/:id"
            element={
              <Suspense fallback={<PageLoader />}>
                <InvoiceForm />
              </Suspense>
            }
          />

          {/* Payments - Lazy loaded */}
          <Route
            path="payments"
            element={
              <Suspense fallback={<PageLoader />}>
                <PaymentList />
              </Suspense>
            }
          />
          <Route
            path="payments/new"
            element={
              <Suspense fallback={<PageLoader />}>
                <PaymentForm />
              </Suspense>
            }
          />
          <Route
            path="payments/:id"
            element={
              <Suspense fallback={<PageLoader />}>
                <PaymentForm />
              </Suspense>
            }
          />

          {/* Users - Lazy loaded */}
          <Route
            path="users"
            element={
              <Suspense fallback={<PageLoader />}>
                <UserList />
              </Suspense>
            }
          />
          <Route
            path="users/new"
            element={
              <Suspense fallback={<PageLoader />}>
                <UserForm />
              </Suspense>
            }
          />
          <Route
            path="users/:id"
            element={
              <Suspense fallback={<PageLoader />}>
                <UserForm />
              </Suspense>
            }
          />

          {/* Production - Lazy loaded (Requirements: 31-42) */}
          <Route
            path="production/workers"
            element={
              <Suspense fallback={<PageLoader />}>
                <WorkerList />
              </Suspense>
            }
          />
          <Route
            path="production/workers/new"
            element={
              <Suspense fallback={<PageLoader />}>
                <WorkerForm />
              </Suspense>
            }
          />
          <Route
            path="production/workers/:id"
            element={
              <Suspense fallback={<PageLoader />}>
                <WorkerForm />
              </Suspense>
            }
          />
          <Route
            path="production/attendance"
            element={
              <Suspense fallback={<PageLoader />}>
                <AttendanceTracking />
              </Suspense>
            }
          />
          <Route
            path="production/piecework"
            element={
              <Suspense fallback={<PageLoader />}>
                <PieceworkTracking />
              </Suspense>
            }
          />
          <Route
            path="production/shifts"
            element={
              <Suspense fallback={<PageLoader />}>
                <ShiftCalendar />
              </Suspense>
            }
          />
          <Route
            path="production/payroll"
            element={
              <Suspense fallback={<PageLoader />}>
                <PayrollList />
              </Suspense>
            }
          />
          <Route
            path="production/advances"
            element={
              <Suspense fallback={<PageLoader />}>
                <AdvancePaymentList />
              </Suspense>
            }
          />
          <Route
            path="production/materials"
            element={
              <Suspense fallback={<PageLoader />}>
                <MaterialList />
              </Suspense>
            }
          />
          <Route
            path="production/materials/new"
            element={
              <Suspense fallback={<PageLoader />}>
                <MaterialForm />
              </Suspense>
            }
          />
          <Route
            path="production/materials/:id"
            element={
              <Suspense fallback={<PageLoader />}>
                <MaterialForm />
              </Suspense>
            }
          />
          <Route
            path="production/materials/transactions"
            element={
              <Suspense fallback={<PageLoader />}>
                <MaterialTransactions />
              </Suspense>
            }
          />
          <Route
            path="production/molds"
            element={
              <Suspense fallback={<PageLoader />}>
                <MoldList />
              </Suspense>
            }
          />
          <Route
            path="production/molds/new"
            element={
              <Suspense fallback={<PageLoader />}>
                <MoldForm />
              </Suspense>
            }
          />
          <Route
            path="production/molds/:id"
            element={
              <Suspense fallback={<PageLoader />}>
                <MoldForm />
              </Suspense>
            }
          />
          <Route
            path="production/molds/maintenance"
            element={
              <Suspense fallback={<PageLoader />}>
                <MoldMaintenance />
              </Suspense>
            }
          />
          <Route
            path="production/orders"
            element={
              <Suspense fallback={<PageLoader />}>
                <ProductionOrderList />
              </Suspense>
            }
          />
          <Route
            path="production/orders/:id"
            element={
              <Suspense fallback={<PageLoader />}>
                <ProductionOrderDetail />
              </Suspense>
            }
          />
          <Route
            path="production/reports"
            element={
              <Suspense fallback={<PageLoader />}>
                <ProductionReports />
              </Suspense>
            }
          />

          {/* Promotions - Lazy loaded (Requirements: 28) */}
          <Route
            path="promotions"
            element={
              <Suspense fallback={<PageLoader />}>
                <PromotionsPage />
              </Suspense>
            }
          />

          {/* Notifications - Lazy loaded (Requirements: 18) */}
          <Route
            path="notifications"
            element={
              <Suspense fallback={<PageLoader />}>
                <NotificationListPage />
              </Suspense>
            }
          />
          <Route
            path="notifications/preferences"
            element={
              <Suspense fallback={<PageLoader />}>
                <NotificationPreferencesPage />
              </Suspense>
            }
          />

          {/* Search - Lazy loaded (Requirements: 16, 58) */}
          <Route
            path="search"
            element={
              <Suspense fallback={<PageLoader />}>
                <SearchResultsPage />
              </Suspense>
            }
          />

          {/* Tenancy - Lazy loaded (Requirements: 43) */}
          <Route
            path="tenancy"
            element={
              <Suspense fallback={<PageLoader />}>
                <TenantManagement />
              </Suspense>
            }
          />

          {/* Offline Demo - Lazy loaded */}
          <Route
            path="offline-demo"
            element={
              <Suspense fallback={<PageLoader />}>
                <OfflineDemo />
              </Suspense>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
