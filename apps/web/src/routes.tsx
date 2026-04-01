import { lazy, type ReactElement } from "react";
import { Alert } from "antd";
import { Navigate, Route, Routes } from "react-router-dom";

import { ProtectedModuleRoute } from "./modules/access-control";
import { useWorkspace } from "./state/WorkspaceContext";
import { AuthenticatedShell, RouteBoundary } from "./modules/shell";

const LoginPage = lazy(() =>
  import("./modules/auth").then((module) => ({ default: module.LoginPage })),
);
const DashboardPage = lazy(() =>
  import("./modules/dashboard").then((module) => ({ default: module.DashboardPage })),
);
const TenantsPage = lazy(() =>
  import("./modules/tenants").then((module) => ({ default: module.TenantsPage })),
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
  import("./modules/reports").then((module) => ({ default: module.ReportsPage })),
);
const ApprovalsPage = lazy(() =>
  import("./modules/approvals").then((module) => ({ default: module.ApprovalsPage })),
);
const OperationsPage = lazy(() =>
  import("./modules/operations").then((module) => ({ default: module.OperationsPage })),
);

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
        <Route path="/login" element={<RouteBoundary><LoginPage /></RouteBoundary>} />
        <Route path="/dashboard" element={<AuthenticatedShell />}>
          <Route index element={<RouteBoundary><DashboardPage /></RouteBoundary>} />
          <Route
            path="tenants"
            element={<ProtectedModuleRoute module="tenant" element={<RouteBoundary><TenantsPage /></RouteBoundary>} />}
          />
          <Route
            path="customers"
            element={
              <ProtectedModuleRoute module="customers" element={<RouteBoundary><CustomersPage /></RouteBoundary>} />
            }
          />
          <Route
            path="suppliers"
            element={
              <ProtectedModuleRoute module="suppliers" element={<RouteBoundary><SuppliersPage /></RouteBoundary>} />
            }
          />
          <Route
            path="products"
            element={
              <ProtectedModuleRoute module="products" element={<RouteBoundary><ProductsPage /></RouteBoundary>} />
            }
          />
          <Route
            path="purchase-orders"
            element={
              <ProtectedModuleRoute
                module="purchasing"
                element={<RouteBoundary><PurchaseOrdersPage /></RouteBoundary>}
              />
            }
          />
          <Route
            path="orders"
            element={<ProtectedModuleRoute module="orders" element={<RouteBoundary><OrdersPage /></RouteBoundary>} />}
          />
          <Route
            path="inventory"
            element={
              <ProtectedModuleRoute module="inventory" element={<RouteBoundary><InventoryPage /></RouteBoundary>} />
            }
          />
          <Route
            path="invoices"
            element={
              <ProtectedModuleRoute module="invoices" element={<RouteBoundary><InvoicesPage /></RouteBoundary>} />
            }
          />
          <Route
            path="reports"
            element={
              <ProtectedModuleRoute module="reporting" element={<RouteBoundary><ReportsPage /></RouteBoundary>} />
            }
          />
          <Route
            path="approvals"
            element={
              <ProtectedModuleRoute module="approvals" element={<RouteBoundary><ApprovalsPage /></RouteBoundary>} />
            }
          />
          <Route
            path="operations"
            element={
              <ProtectedModuleRoute module="operations" element={<RouteBoundary><OperationsPage /></RouteBoundary>} />
            }
          />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  );
}
