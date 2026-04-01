import type {
  ApprovalRequestRecord,
  CustomerStatementRecord,
  CustomerRecord,
  FoundationModule,
  InvoiceCollectionActivityRecord,
  InvoiceRecord,
  InventoryRecord,
  OrderRecord,
  ProductRecord,
  PurchaseOrderRecord,
  SupplierRecord,
} from "@smarterp/contracts";

import { loadApprovalRequests } from "../modules/approvals/api";
import { loadCustomers, loadCustomerStatements } from "../modules/customers/api";
import { loadInventory } from "../modules/inventory/api";
import {
  loadInvoiceCollectionActivities,
  loadInvoices,
} from "../modules/invoices/api";
import { loadOrders } from "../modules/orders/api";
import { loadPurchaseOrders } from "../modules/purchase-orders/api";
import { loadProducts } from "../modules/products/api";
import { loadSuppliers } from "../modules/suppliers/api";

export type TenantWorkspaceData = {
  approvalRequests: ApprovalRequestRecord[];
  customers: CustomerRecord[];
  suppliers: SupplierRecord[];
  customerStatements: CustomerStatementRecord[];
  collectionActivities: InvoiceCollectionActivityRecord[];
  products: ProductRecord[];
  inventories: InventoryRecord[];
  orders: OrderRecord[];
  purchaseOrders: PurchaseOrderRecord[];
  invoices: InvoiceRecord[];
};

export function createEmptyTenantWorkspaceData(): TenantWorkspaceData {
  return {
    approvalRequests: [],
    customers: [],
    suppliers: [],
    customerStatements: [],
    collectionActivities: [],
    products: [],
    inventories: [],
    orders: [],
    purchaseOrders: [],
    invoices: [],
  };
}

export async function loadTenantWorkspaceData(
  tenantId: string,
  canAccessModule: (module: FoundationModule) => boolean,
): Promise<TenantWorkspaceData> {
  const [
    approvalRequests,
    customers,
    suppliers,
    customerStatements,
    collectionActivities,
    products,
    inventories,
    orders,
    purchaseOrders,
    invoices,
  ] = await Promise.all([
    canAccessModule("approvals") ? loadApprovalRequests(tenantId) : Promise.resolve([]),
    canAccessModule("customers") ? loadCustomers(tenantId) : Promise.resolve([]),
    canAccessModule("suppliers") ? loadSuppliers(tenantId) : Promise.resolve([]),
    canAccessModule("customers") ? loadCustomerStatements(tenantId) : Promise.resolve([]),
    canAccessModule("invoices") ? loadInvoiceCollectionActivities(tenantId) : Promise.resolve([]),
    canAccessModule("products") ? loadProducts(tenantId) : Promise.resolve([]),
    canAccessModule("inventory") ? loadInventory(tenantId) : Promise.resolve([]),
    canAccessModule("orders") ? loadOrders(tenantId) : Promise.resolve([]),
    canAccessModule("purchasing") ? loadPurchaseOrders(tenantId) : Promise.resolve([]),
    canAccessModule("invoices") ? loadInvoices(tenantId) : Promise.resolve([]),
  ]);

  return {
    approvalRequests,
    customers,
    suppliers,
    customerStatements,
    collectionActivities,
    products,
    inventories,
    orders,
    purchaseOrders,
    invoices,
  };
}

export function requireSelectedTenantId(selectedTenantId: string): string {
  if (!selectedTenantId) {
    throw new Error("Select a tenant first.");
  }

  return selectedTenantId;
}
