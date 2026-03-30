import type { PropsWithChildren, ReactElement } from "react";
import { createContext, useContext, useEffect, useState } from "react";

import type {
  CreateCustomerInput,
  CreateInvoiceInput,
  CreateInvoicePaymentInput,
  CreateInventoryAdjustmentInput,
  CreateOrderInput,
  CreateProductInput,
  CreateTenantInput,
  CustomerStatementRecord,
  CustomerRecord,
  FoundationSnapshot,
  InvoiceRecord,
  InventoryRecord,
  LoginInput,
  OrderRecord,
  ProductRecord,
  Session,
  TenantRecord,
} from "@smarterp/contracts";

import {
  createCustomer,
  createInvoice,
  createInvoicePayment,
  createInventoryAdjustment,
  createOrder,
  createProduct,
  createTenant,
  getFoundation,
  listCustomers,
  listCustomerStatements,
  listInventory,
  listInvoices,
  listOrders,
  listProducts,
  listTenants,
  login,
  setApiSession,
  setUnauthorizedHandler,
} from "../api";
import { localizeErrorMessage } from "../locale/errorMessages";
import { useLocale } from "../locale/LocaleContext";
import {
  clearStoredWorkspaceState,
  readStoredSession,
  readStoredTenantId,
  writeStoredSession,
  writeStoredTenantId,
} from "./workspaceStorage";

type WorkspaceContextValue = {
  foundation: FoundationSnapshot | null;
  isBooting: boolean;
  isBusy: boolean;
  error: string;
  clearError: () => void;
  session: Session | null;
  tenants: TenantRecord[];
  selectedTenantId: string;
  selectedTenant: TenantRecord | null;
  customers: CustomerRecord[];
  customerStatements: CustomerStatementRecord[];
  products: ProductRecord[];
  inventories: InventoryRecord[];
  orders: OrderRecord[];
  invoices: InvoiceRecord[];
  loginToWorkspace: (input: LoginInput) => Promise<void>;
  logoutFromWorkspace: () => void;
  setSelectedTenantId: (tenantId: string) => void;
  createTenantRecord: (input: CreateTenantInput) => Promise<void>;
  createCustomerRecord: (input: Omit<CreateCustomerInput, "tenantId">) => Promise<void>;
  createProductRecord: (input: Omit<CreateProductInput, "tenantId">) => Promise<void>;
  createInventoryAdjustmentRecord: (
    input: Omit<CreateInventoryAdjustmentInput, "tenantId">,
  ) => Promise<void>;
  createOrderRecord: (input: Omit<CreateOrderInput, "tenantId">) => Promise<void>;
  createInvoiceRecord: (input: Omit<CreateInvoiceInput, "tenantId">) => Promise<void>;
  createInvoicePaymentRecord: (input: Omit<CreateInvoicePaymentInput, "tenantId">) => Promise<void>;
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: PropsWithChildren): ReactElement {
  const { t } = useLocale();
  const [foundation, setFoundation] = useState<FoundationSnapshot | null>(null);
  const [isBooting, setIsBooting] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [session, setSession] = useState<Session | null>(() => readStoredSession());
  const [tenants, setTenants] = useState<TenantRecord[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState(() => readStoredTenantId());
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [customerStatements, setCustomerStatements] = useState<CustomerStatementRecord[]>([]);
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [inventories, setInventories] = useState<InventoryRecord[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const error = errorMessage ? localizeErrorMessage(errorMessage, t) : "";

  useEffect(() => {
    setApiSession(session);
  }, [session]);

  useEffect(() => {
    setUnauthorizedHandler((message) => {
      clearStoredWorkspaceState();
      setSession(null);
      setSelectedTenantId("");
      setErrorMessage(message);
    });

    return () => {
      setUnauthorizedHandler(null);
    };
  }, []);

  useEffect(() => {
    getFoundation()
      .then(setFoundation)
      .catch((caught: unknown) => {
        setErrorMessage(caught instanceof Error ? caught.message : "Failed to load foundation.");
      })
      .finally(() => {
        setIsBooting(false);
      });
  }, []);

  useEffect(() => {
    writeStoredSession(session);
  }, [session]);

  useEffect(() => {
    writeStoredTenantId(selectedTenantId);
  }, [selectedTenantId]);

  useEffect(() => {
    if (!session) {
      setTenants([]);
      setSelectedTenantId("");
      setCustomers([]);
      setCustomerStatements([]);
      setProducts([]);
      setInventories([]);
      setOrders([]);
      setInvoices([]);
      return;
    }

    listTenants()
      .then((items) => {
        setTenants(items);
        setSelectedTenantId((current) =>
          items.some((tenant) => tenant.id === current) ? current : (items[0]?.id ?? ""),
        );
      })
      .catch((caught: unknown) => {
        setErrorMessage(caught instanceof Error ? caught.message : "Failed to load tenants.");
      });
  }, [session]);

  useEffect(() => {
    if (!selectedTenantId) {
      setCustomers([]);
      setCustomerStatements([]);
      setProducts([]);
      setInventories([]);
      setOrders([]);
      setInvoices([]);
      return;
    }

    listCustomers(selectedTenantId)
      .then(setCustomers)
      .catch((caught: unknown) => {
        setErrorMessage(caught instanceof Error ? caught.message : "Failed to load customers.");
      });

    listCustomerStatements(selectedTenantId)
      .then(setCustomerStatements)
      .catch((caught: unknown) => {
        setErrorMessage(caught instanceof Error ? caught.message : "Failed to load customer statements.");
      });

    listProducts(selectedTenantId)
      .then(setProducts)
      .catch((caught: unknown) => {
        setErrorMessage(caught instanceof Error ? caught.message : "Failed to load products.");
      });

    listInventory(selectedTenantId)
      .then(setInventories)
      .catch((caught: unknown) => {
        setErrorMessage(caught instanceof Error ? caught.message : "Failed to load inventory.");
      });

    listOrders(selectedTenantId)
      .then(setOrders)
      .catch((caught: unknown) => {
        setErrorMessage(caught instanceof Error ? caught.message : "Failed to load orders.");
      });

    listInvoices(selectedTenantId)
      .then(setInvoices)
      .catch((caught: unknown) => {
        setErrorMessage(caught instanceof Error ? caught.message : "Failed to load invoices.");
      });
  }, [selectedTenantId]);

  async function loginToWorkspace(input: LoginInput): Promise<void> {
    setIsBusy(true);
    setErrorMessage("");

    try {
      const result = await login(input);
      setSession(result.session);
    } catch (caught) {
      setErrorMessage(caught instanceof Error ? caught.message : "Login failed.");
      throw caught;
    } finally {
      setIsBusy(false);
    }
  }

  function logoutFromWorkspace(): void {
    clearStoredWorkspaceState();
    setSession(null);
    setSelectedTenantId("");
    setErrorMessage("");
  }

  async function createTenantRecord(input: CreateTenantInput): Promise<void> {
    setIsBusy(true);
    setErrorMessage("");

    try {
      const created = await createTenant(input);
      setTenants((current) => [created, ...current]);
      setSelectedTenantId(created.id);
    } catch (caught) {
      setErrorMessage(caught instanceof Error ? caught.message : "Tenant creation failed.");
      throw caught;
    } finally {
      setIsBusy(false);
    }
  }

  async function createCustomerRecord(
    input: Omit<CreateCustomerInput, "tenantId">,
  ): Promise<void> {
    if (!selectedTenantId) {
      setErrorMessage("Select a tenant first.");
      return;
    }

    setIsBusy(true);
    setErrorMessage("");

    try {
      const created = await createCustomer({ ...input, tenantId: selectedTenantId });
      setCustomers((current) => [created, ...current]);
      const nextCustomerStatements = await listCustomerStatements(selectedTenantId);
      setCustomerStatements(nextCustomerStatements);
    } catch (caught) {
      setErrorMessage(caught instanceof Error ? caught.message : "Customer creation failed.");
      throw caught;
    } finally {
      setIsBusy(false);
    }
  }

  async function createProductRecord(
    input: Omit<CreateProductInput, "tenantId">,
  ): Promise<void> {
    if (!selectedTenantId) {
      setErrorMessage("Select a tenant first.");
      return;
    }

    setIsBusy(true);
    setErrorMessage("");

    try {
      const created = await createProduct({ ...input, tenantId: selectedTenantId });
      setProducts((current) => [created, ...current]);
      const nextInventory = await listInventory(selectedTenantId);
      setInventories(nextInventory);
    } catch (caught) {
      setErrorMessage(caught instanceof Error ? caught.message : "Product creation failed.");
      throw caught;
    } finally {
      setIsBusy(false);
    }
  }

  async function createInventoryAdjustmentRecord(
    input: Omit<CreateInventoryAdjustmentInput, "tenantId">,
  ): Promise<void> {
    if (!selectedTenantId) {
      setErrorMessage("Select a tenant first.");
      return;
    }

    setIsBusy(true);
    setErrorMessage("");

    try {
      const updated = await createInventoryAdjustment({ ...input, tenantId: selectedTenantId });
      setInventories((current) => {
        const next = current.filter((item) => item.productId !== updated.productId);
        return [...next, updated].sort((left, right) => left.productName.localeCompare(right.productName));
      });
    } catch (caught) {
      setErrorMessage(caught instanceof Error ? caught.message : "Inventory adjustment failed.");
      throw caught;
    } finally {
      setIsBusy(false);
    }
  }

  async function createOrderRecord(input: Omit<CreateOrderInput, "tenantId">): Promise<void> {
    if (!selectedTenantId) {
      setErrorMessage("Select a tenant first.");
      return;
    }

    setIsBusy(true);
    setErrorMessage("");

    try {
      const created = await createOrder({ ...input, tenantId: selectedTenantId });
      setOrders((current) => [created, ...current]);
      const nextInventory = await listInventory(selectedTenantId);
      setInventories(nextInventory);
    } catch (caught) {
      setErrorMessage(caught instanceof Error ? caught.message : "Order creation failed.");
      throw caught;
    } finally {
      setIsBusy(false);
    }
  }

  async function createInvoiceRecord(input: Omit<CreateInvoiceInput, "tenantId">): Promise<void> {
    if (!selectedTenantId) {
      setErrorMessage("Select a tenant first.");
      return;
    }

    setIsBusy(true);
    setErrorMessage("");

    try {
      const created = await createInvoice({ ...input, tenantId: selectedTenantId });
      setInvoices((current) => [created, ...current]);
      const nextCustomerStatements = await listCustomerStatements(selectedTenantId);
      setCustomerStatements(nextCustomerStatements);
    } catch (caught) {
      setErrorMessage(caught instanceof Error ? caught.message : "Invoice creation failed.");
      throw caught;
    } finally {
      setIsBusy(false);
    }
  }

  async function createInvoicePaymentRecord(
    input: Omit<CreateInvoicePaymentInput, "tenantId">,
  ): Promise<void> {
    if (!selectedTenantId) {
      setErrorMessage("Select a tenant first.");
      return;
    }

    setIsBusy(true);
    setErrorMessage("");

    try {
      const updatedInvoice = await createInvoicePayment({ ...input, tenantId: selectedTenantId });
      setInvoices((current) =>
        current.map((invoice) => (invoice.id === updatedInvoice.id ? updatedInvoice : invoice)),
      );
      const nextCustomerStatements = await listCustomerStatements(selectedTenantId);
      setCustomerStatements(nextCustomerStatements);
    } catch (caught) {
      setErrorMessage(caught instanceof Error ? caught.message : "Invoice payment failed.");
      throw caught;
    } finally {
      setIsBusy(false);
    }
  }

  function clearError(): void {
    setErrorMessage("");
  }

  const selectedTenant = tenants.find((tenant) => tenant.id === selectedTenantId) ?? null;

  return (
    <WorkspaceContext.Provider
      value={{
        foundation,
        isBooting,
        isBusy,
        error,
        clearError,
        session,
        tenants,
        selectedTenantId,
        selectedTenant,
        customers,
        customerStatements,
        products,
        inventories,
        orders,
        invoices,
        loginToWorkspace,
        logoutFromWorkspace,
        setSelectedTenantId,
        createTenantRecord,
        createCustomerRecord,
        createProductRecord,
        createInventoryAdjustmentRecord,
        createOrderRecord,
        createInvoiceRecord,
        createInvoicePaymentRecord,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace(): WorkspaceContextValue {
  const context = useContext(WorkspaceContext);

  if (!context) {
    throw new Error("useWorkspace must be used inside WorkspaceProvider.");
  }

  return context;
}
