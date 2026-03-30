import { Suspense, lazy, type ReactElement } from "react";
import { Alert, Spin } from "antd";
import { Navigate, Route, Routes } from "react-router-dom";

import { MainLayout } from "./layout/MainLayout";
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
  import("./pages/CustomersPage").then((module) => ({ default: module.CustomersPage })),
);
const ProductsPage = lazy(() =>
  import("./pages/ProductsPage").then((module) => ({ default: module.ProductsPage })),
);
const OrdersPage = lazy(() =>
  import("./pages/OrdersPage").then((module) => ({ default: module.OrdersPage })),
);
const InventoryPage = lazy(() =>
  import("./pages/InventoryPage").then((module) => ({ default: module.InventoryPage })),
);
const InvoicesPage = lazy(() =>
  import("./pages/InvoicesPage").then((module) => ({ default: module.InvoicesPage })),
);
const ReportsPage = lazy(() =>
  import("./pages/ReportsPage").then((module) => ({ default: module.ReportsPage })),
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

export function AppRoutes(): ReactElement {
  const { error, clearError } = useWorkspace();

  return (
    <>
      {error ? (
        <div className="global-alert">
          <Alert description={error} type="error" closable onClose={clearError} showIcon />
        </div>
      ) : null}

      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={withLazyBoundary(<LoginPage />)} />
        <Route path="/dashboard" element={<ProtectedShell />}>
          <Route index element={withLazyBoundary(<DashboardPage />)} />
          <Route path="tenants" element={withLazyBoundary(<TenantsPage />)} />
          <Route path="customers" element={withLazyBoundary(<CustomersPage />)} />
          <Route path="products" element={withLazyBoundary(<ProductsPage />)} />
          <Route path="orders" element={withLazyBoundary(<OrdersPage />)} />
          <Route path="inventory" element={withLazyBoundary(<InventoryPage />)} />
          <Route path="invoices" element={withLazyBoundary(<InvoicesPage />)} />
          <Route path="reports" element={withLazyBoundary(<ReportsPage />)} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  );
}
