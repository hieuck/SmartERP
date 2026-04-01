import { Suspense, lazy, type ReactElement } from "react";
import { Alert, Spin } from "antd";
import { Navigate, Route, Routes } from "react-router-dom";

import type { FoundationModule } from "@smarterp/contracts";

import { MainLayout } from "./layout/MainLayout";
import { AccessDeniedPage } from "./pages/AccessDeniedPage";
import { useWorkspace } from "./state/WorkspaceContext";

const LoginPage = lazy(() =>
  import("./pages/LoginPage").then((module) => ({ default: module.LoginPage })),
);
const DashboardPage = lazy(() =>
  import("./pages/DashboardPage").then((module) => ({ default: module.DashboardPage })),
);
const TenantsPage = lazy(() =>
  import("./pages/TenantsPage").then((module) => ({ default: module.TenantsPage })),
);
const CustomersPage = lazy(() =>
  import("./modules/customers").then((module) => ({ default: module.CustomersPage })),
);
const SuppliersPage = lazy(() =>
  import("./modules/suppliers").then((module) => ({ default: module.SuppliersPage })),
);
const ProductsPage = lazy(() =>
  import("./modules/products").then((module) => ({ default: module.ProductsPage })),
);
const PurchaseOrdersPage = lazy(() =>
  import("./modules/purchase-orders").then((module) => ({ default: module.PurchaseOrdersPage })),
);
const OrdersPage = lazy(() =>
  import("./modules/orders").then((module) => ({ default: module.OrdersPage })),
);
const InventoryPage = lazy(() =>
  import("./modules/inventory").then((module) => ({ default: module.InventoryPage })),
);
const InvoicesPage = lazy(() =>
  import("./modules/invoices").then((module) => ({ default: module.InvoicesPage })),
);
const ReportsPage = lazy(() =>
  import("./pages/ReportsPage").then((module) => ({ default: module.ReportsPage })),
);
const ApprovalsPage = lazy(() =>
  import("./pages/ApprovalsPage").then((module) => ({ default: module.ApprovalsPage })),
);
const OperationsPage = lazy(() =>
  import("./modules/operations").then((module) => ({ default: module.OperationsPage })),
);

function RouteFallback(): ReactElement {
  return (
    <div className="boot-screen">
      <Spin size="large" />
    </div>
  );
}

function withLazyBoundary(element: ReactElement): ReactElement {
  return <Suspense fallback={<RouteFallback />}>{element}</Suspense>;
}

function ProtectedShell(): ReactElement {
  const { session, isBooting } = useWorkspace();

  if (isBooting) {
    return (
      <div className="boot-screen">
        <Spin size="large" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <MainLayout />;
}

function ProtectedModuleRoute({
  module,
  element,
}: {
  module: FoundationModule;
  element: ReactElement;
}): ReactElement {
  const { canAccessModule } = useWorkspace();

  if (!canAccessModule(module)) {
    return <AccessDeniedPage module={module} />;
  }

  return element;
}

export function AppRoutes(): ReactElement {
  const { error, notice, clearError, clearNotice } = useWorkspace();

  return (
    <>
      {notice ? (
        <div className="global-alert global-alert-notice">
          <Alert description={notice} type="info" closable onClose={clearNotice} showIcon />
        </div>
      ) : null}
      {error ? (
        <div className="global-alert global-alert-error">
          <Alert description={error} type="error" closable onClose={clearError} showIcon />
        </div>
      ) : null}

      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={withLazyBoundary(<LoginPage />)} />
        <Route path="/dashboard" element={<ProtectedShell />}>
          <Route index element={withLazyBoundary(<DashboardPage />)} />
          <Route
            path="tenants"
            element={<ProtectedModuleRoute module="tenant" element={withLazyBoundary(<TenantsPage />)} />}
          />
          <Route
            path="customers"
            element={<ProtectedModuleRoute module="customers" element={withLazyBoundary(<CustomersPage />)} />}
          />
          <Route
            path="suppliers"
            element={<ProtectedModuleRoute module="suppliers" element={withLazyBoundary(<SuppliersPage />)} />}
          />
          <Route
            path="products"
            element={<ProtectedModuleRoute module="products" element={withLazyBoundary(<ProductsPage />)} />}
          />
          <Route
            path="purchase-orders"
            element={<ProtectedModuleRoute module="purchasing" element={withLazyBoundary(<PurchaseOrdersPage />)} />}
          />
          <Route
            path="orders"
            element={<ProtectedModuleRoute module="orders" element={withLazyBoundary(<OrdersPage />)} />}
          />
          <Route
            path="inventory"
            element={<ProtectedModuleRoute module="inventory" element={withLazyBoundary(<InventoryPage />)} />}
          />
          <Route
            path="invoices"
            element={<ProtectedModuleRoute module="invoices" element={withLazyBoundary(<InvoicesPage />)} />}
          />
          <Route
            path="reports"
            element={<ProtectedModuleRoute module="reporting" element={withLazyBoundary(<ReportsPage />)} />}
          />
          <Route
            path="approvals"
            element={<ProtectedModuleRoute module="approvals" element={withLazyBoundary(<ApprovalsPage />)} />}
          />
          <Route
            path="operations"
            element={<ProtectedModuleRoute module="operations" element={withLazyBoundary(<OperationsPage />)} />}
          />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  );
}
