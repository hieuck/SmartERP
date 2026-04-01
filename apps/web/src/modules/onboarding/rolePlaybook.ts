import type { FoundationModule, UserRole } from "@smarterp/contracts";

type RoleOnboardingSnapshot = {
  hasSelectedTenant: boolean;
  customersCount: number;
  suppliersCount: number;
  productsCount: number;
  inventoriesCount: number;
  ordersCount: number;
  purchaseOrdersCount: number;
  openInvoicesCount: number;
  overdueInvoicesCount: number;
  todayCollectionsCount: number;
};

type RoleOnboardingStepDefinition = {
  key: "step1" | "step2" | "step3";
  module: FoundationModule;
  route: string;
  isReady: (snapshot: RoleOnboardingSnapshot) => boolean;
};

type RoleOnboardingDefinition = {
  primaryModule: FoundationModule;
  primaryRoute: string;
  secondaryModule: FoundationModule;
  secondaryRoute: string;
  steps: RoleOnboardingStepDefinition[];
};

export type RoleOnboardingStep = {
  key: "step1" | "step2" | "step3";
  module: FoundationModule;
  route: string;
  ready: boolean;
};

export type RoleOnboardingPlaybook = {
  primaryModule: FoundationModule;
  primaryRoute: string;
  secondaryModule: FoundationModule;
  secondaryRoute: string;
  ready: boolean;
  steps: RoleOnboardingStep[];
};

const moduleRoutes: Record<FoundationModule, string> = {
  identity: "/dashboard",
  setup: "/dashboard/setup",
  tenant: "/dashboard/tenants",
  customers: "/dashboard/customers",
  suppliers: "/dashboard/suppliers",
  products: "/dashboard/products",
  purchasing: "/dashboard/purchase-orders",
  orders: "/dashboard/orders",
  inventory: "/dashboard/inventory",
  invoices: "/dashboard/invoices",
  reporting: "/dashboard/reports",
  approvals: "/dashboard/approvals",
  operations: "/dashboard/operations",
};

const roleOnboardingDefinitions: Record<UserRole, RoleOnboardingDefinition> = {
  founder: {
    primaryModule: "setup",
    primaryRoute: moduleRoutes.setup,
    secondaryModule: "operations",
    secondaryRoute: moduleRoutes.operations,
    steps: [
      {
        key: "step1",
        module: "setup",
        route: moduleRoutes.setup,
        isReady: (snapshot) => snapshot.hasSelectedTenant,
      },
      {
        key: "step2",
        module: "approvals",
        route: moduleRoutes.approvals,
        isReady: (snapshot) =>
          snapshot.customersCount > 0 && snapshot.suppliersCount > 0 && snapshot.productsCount > 0,
      },
      {
        key: "step3",
        module: "operations",
        route: moduleRoutes.operations,
        isReady: (snapshot) => snapshot.openInvoicesCount > 0 || snapshot.purchaseOrdersCount > 0,
      },
    ],
  },
  finance: {
    primaryModule: "invoices",
    primaryRoute: moduleRoutes.invoices,
    secondaryModule: "reporting",
    secondaryRoute: moduleRoutes.reporting,
    steps: [
      {
        key: "step1",
        module: "invoices",
        route: moduleRoutes.invoices,
        isReady: (snapshot) => snapshot.hasSelectedTenant && (snapshot.ordersCount > 0 || snapshot.openInvoicesCount > 0),
      },
      {
        key: "step2",
        module: "invoices",
        route: moduleRoutes.invoices,
        isReady: (snapshot) => snapshot.hasSelectedTenant && snapshot.openInvoicesCount > 0,
      },
      {
        key: "step3",
        module: "reporting",
        route: moduleRoutes.reporting,
        isReady: (snapshot) => snapshot.hasSelectedTenant,
      },
    ],
  },
  sales: {
    primaryModule: "customers",
    primaryRoute: moduleRoutes.customers,
    secondaryModule: "orders",
    secondaryRoute: moduleRoutes.orders,
    steps: [
      {
        key: "step1",
        module: "customers",
        route: moduleRoutes.customers,
        isReady: (snapshot) => snapshot.hasSelectedTenant,
      },
      {
        key: "step2",
        module: "products",
        route: moduleRoutes.products,
        isReady: (snapshot) => snapshot.productsCount > 0,
      },
      {
        key: "step3",
        module: "orders",
        route: moduleRoutes.orders,
        isReady: (snapshot) => snapshot.customersCount > 0 && snapshot.productsCount > 0,
      },
    ],
  },
  warehouse: {
    primaryModule: "inventory",
    primaryRoute: moduleRoutes.inventory,
    secondaryModule: "purchasing",
    secondaryRoute: moduleRoutes.purchasing,
    steps: [
      {
        key: "step1",
        module: "products",
        route: moduleRoutes.products,
        isReady: (snapshot) => snapshot.productsCount > 0,
      },
      {
        key: "step2",
        module: "purchasing",
        route: moduleRoutes.purchasing,
        isReady: (snapshot) => snapshot.purchaseOrdersCount > 0,
      },
      {
        key: "step3",
        module: "inventory",
        route: moduleRoutes.inventory,
        isReady: (snapshot) => snapshot.productsCount > 0 && snapshot.inventoriesCount > 0,
      },
    ],
  },
  purchasing: {
    primaryModule: "suppliers",
    primaryRoute: moduleRoutes.suppliers,
    secondaryModule: "purchasing",
    secondaryRoute: moduleRoutes.purchasing,
    steps: [
      {
        key: "step1",
        module: "suppliers",
        route: moduleRoutes.suppliers,
        isReady: (snapshot) => snapshot.hasSelectedTenant,
      },
      {
        key: "step2",
        module: "products",
        route: moduleRoutes.products,
        isReady: (snapshot) => snapshot.productsCount > 0,
      },
      {
        key: "step3",
        module: "purchasing",
        route: moduleRoutes.purchasing,
        isReady: (snapshot) => snapshot.suppliersCount > 0 && snapshot.productsCount > 0,
      },
    ],
  },
  collector: {
    primaryModule: "invoices",
    primaryRoute: moduleRoutes.invoices,
    secondaryModule: "reporting",
    secondaryRoute: moduleRoutes.reporting,
    steps: [
      {
        key: "step1",
        module: "invoices",
        route: moduleRoutes.invoices,
        isReady: (snapshot) => snapshot.hasSelectedTenant && snapshot.todayCollectionsCount > 0,
      },
      {
        key: "step2",
        module: "invoices",
        route: moduleRoutes.invoices,
        isReady: (snapshot) => snapshot.hasSelectedTenant && snapshot.openInvoicesCount > 0,
      },
      {
        key: "step3",
        module: "reporting",
        route: moduleRoutes.reporting,
        isReady: (snapshot) => snapshot.hasSelectedTenant && snapshot.overdueInvoicesCount > 0,
      },
    ],
  },
};

export function getRoleOnboardingPlaybook(
  role: UserRole,
  snapshot: RoleOnboardingSnapshot,
): RoleOnboardingPlaybook {
  const definition = roleOnboardingDefinitions[role];
  const steps = definition.steps.map((step) => ({
    key: step.key,
    module: step.module,
    route: step.route,
    ready: step.isReady(snapshot),
  }));

  return {
    primaryModule: definition.primaryModule,
    primaryRoute: definition.primaryRoute,
    secondaryModule: definition.secondaryModule,
    secondaryRoute: definition.secondaryRoute,
    ready: steps.every((step) => step.ready),
    steps,
  };
}
