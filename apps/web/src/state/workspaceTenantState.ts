import { useState } from "react";

import type {
  ApprovalRequestRecord,
  CustomerRecord,
  CustomerStatementRecord,
  InvoiceCollectionActivityRecord,
  InvoiceRecord,
  InventoryRecord,
  OrderRecord,
  ProductCategoryRecord,
  ProductRecord,
  PurchaseOrderRecord,
  SupplierRecord,
} from "@smarterp/contracts";

import {
  createEmptyTenantWorkspaceData,
  type TenantWorkspaceData,
} from "./workspaceTenantData";

export type WorkspaceTenantState = {
  approvalRequests: ApprovalRequestRecord[];
  customers: CustomerRecord[];
  suppliers: SupplierRecord[];
  customerStatements: CustomerStatementRecord[];
  collectionActivities: InvoiceCollectionActivityRecord[];
  productCategories: ProductCategoryRecord[];
  products: ProductRecord[];
  inventories: InventoryRecord[];
  orders: OrderRecord[];
  purchaseOrders: PurchaseOrderRecord[];
  invoices: InvoiceRecord[];
  applyTenantWorkspaceData: (data: TenantWorkspaceData) => void;
  resetTenantWorkspaceData: () => void;
};

export function useWorkspaceTenantState(): WorkspaceTenantState {
  const [approvalRequests, setApprovalRequests] = useState<ApprovalRequestRecord[]>([]);
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierRecord[]>([]);
  const [customerStatements, setCustomerStatements] = useState<CustomerStatementRecord[]>([]);
  const [collectionActivities, setCollectionActivities] = useState<InvoiceCollectionActivityRecord[]>([]);
  const [productCategories, setProductCategories] = useState<ProductCategoryRecord[]>([]);
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [inventories, setInventories] = useState<InventoryRecord[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderRecord[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);

  function applyTenantWorkspaceData(data: TenantWorkspaceData): void {
    setApprovalRequests(data.approvalRequests);
    setCustomers(data.customers);
    setSuppliers(data.suppliers);
    setCustomerStatements(data.customerStatements);
    setCollectionActivities(data.collectionActivities);
    setProductCategories(data.productCategories);
    setProducts(data.products);
    setInventories(data.inventories);
    setOrders(data.orders);
    setPurchaseOrders(data.purchaseOrders);
    setInvoices(data.invoices);
  }

  function resetTenantWorkspaceData(): void {
    applyTenantWorkspaceData(createEmptyTenantWorkspaceData());
  }

  return {
    approvalRequests,
    customers,
    suppliers,
    customerStatements,
    collectionActivities,
    productCategories,
    products,
    inventories,
    orders,
    purchaseOrders,
    invoices,
    applyTenantWorkspaceData,
    resetTenantWorkspaceData,
  };
}
