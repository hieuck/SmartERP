import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

// Import translation files
import enAuth from './locales/en/auth.json';
import enCommon from './locales/en/common.json';
import enCustomers from './locales/en/customers.json';
import enDashboard from './locales/en/dashboard.json';
import enInventory from './locales/en/inventory.json';
import enInvoices from './locales/en/invoices.json';
import enLayout from './locales/en/layout.json';
import enNotifications from './locales/en/notifications.json';
import enOrders from './locales/en/orders.json';
import enPayments from './locales/en/payments.json';
import enProduction from './locales/en/production.json';
import enProducts from './locales/en/products.json';
import enReports from './locales/en/reports.json';
import enSettings from './locales/en/settings.json';
import enSuppliers from './locales/en/suppliers.json';
import enUsers from './locales/en/users.json';
import enWarehouses from './locales/en/warehouses.json';

import viAuth from './locales/vi/auth.json';
import viCommonUi from './locales/vi/common-ui.json';
import viCommon from './locales/vi/common.json';
import viCustomers from './locales/vi/customers.json';
import viDashboard from './locales/vi/dashboard.json';
import viInventory from './locales/vi/inventory.json';
import viInvoices from './locales/vi/invoices.json';
import viLayout from './locales/vi/layout.json';
import viNotifications from './locales/vi/notifications.json';
import viOrders from './locales/vi/orders.json';
import viPayments from './locales/vi/payments.json';
import viProduction from './locales/vi/production.json';
import viProducts from './locales/vi/products.json';
import viReports from './locales/vi/reports.json';
import viSettings from './locales/vi/settings.json';
import viSuppliers from './locales/vi/suppliers.json';
import viUsers from './locales/vi/users.json';
import viWarehouses from './locales/vi/warehouses.json';

import enAccounting from './locales/en/accounting.json';
import enAudit from './locales/en/audit.json';
import enCommonUi from './locales/en/common-ui.json';
import enEcommerce from './locales/en/ecommerce.json';
import enEmployees from './locales/en/employees.json';
import enHr from './locales/en/hr.json';
import enLanding from './locales/en/landing.json';
import enLeave from './locales/en/leave.json';
import enOffline from './locales/en/offline.json';
import enPayroll from './locales/en/payroll.json';
import enProjects from './locales/en/projects.json';
import enPurchaseOrders from './locales/en/purchaseOrders.json';
import enSearch from './locales/en/search.json';
import enTenancy from './locales/en/tenancy.json';

import viAccounting from './locales/vi/accounting.json';
import viAudit from './locales/vi/audit.json';
import viEcommerce from './locales/vi/ecommerce.json';
import viEmployees from './locales/vi/employees.json';
import viHr from './locales/vi/hr.json';
import viLanding from './locales/vi/landing.json';
import viLeave from './locales/vi/leave.json';
import viOffline from './locales/vi/offline.json';
import viPayroll from './locales/vi/payroll.json';
import viProjects from './locales/vi/projects.json';
import viPurchaseOrders from './locales/vi/purchaseOrders.json';
import viSearch from './locales/vi/search.json';
import viTenancy from './locales/vi/tenancy.json';

// Translation resources
const resources = {
  en: {
    common: enCommon,
    auth: enAuth,
    dashboard: enDashboard,
    products: enProducts,
    orders: enOrders,
    customers: enCustomers,
    inventory: enInventory,
    warehouses: enWarehouses,
    suppliers: enSuppliers,
    payments: enPayments,
    invoices: enInvoices,
    users: enUsers,
    production: enProduction,
    reports: enReports,
    settings: enSettings,
    notifications: enNotifications,
    layout: enLayout,
    commonUi: enCommonUi,
    audit: enAudit,
    hr: enHr,
    purchaseOrders: enPurchaseOrders,
    search: enSearch,
    tenancy: enTenancy,
    landing: enLanding,
    offline: enOffline,
    employees: enEmployees,
    leave: enLeave,
    payroll: enPayroll,
    projects: enProjects,
    accounting: enAccounting,
    ecommerce: enEcommerce,
  },
  vi: {
    common: viCommon,
    auth: viAuth,
    dashboard: viDashboard,
    products: viProducts,
    orders: viOrders,
    customers: viCustomers,
    inventory: viInventory,
    warehouses: viWarehouses,
    suppliers: viSuppliers,
    payments: viPayments,
    invoices: viInvoices,
    users: viUsers,
    production: viProduction,
    reports: viReports,
    settings: viSettings,
    notifications: viNotifications,
    layout: viLayout,
    commonUi: viCommonUi,
    audit: viAudit,
    hr: viHr,
    purchaseOrders: viPurchaseOrders,
    search: viSearch,
    tenancy: viTenancy,
    landing: viLanding,
    offline: viOffline,
    employees: viEmployees,
    leave: viLeave,
    payroll: viPayroll,
    projects: viProjects,
    accounting: viAccounting,
    ecommerce: viEcommerce,
  },
};

i18n
  .use(LanguageDetector) // Detect user language
  .use(initReactI18next) // Pass i18n instance to react-i18next
  .init({
    resources,
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: [
      'common',
      'auth',
      'dashboard',
      'products',
      'orders',
      'customers',
      'inventory',
      'warehouses',
      'suppliers',
      'payments',
      'invoices',
      'users',
      'production',
      'reports',
      'settings',
      'notifications',
      'layout',
      'commonUi',
      'audit',
      'hr',
      'purchaseOrders',
      'search',
      'tenancy',
      'landing',
      'offline',
      'employees',
      'leave',
      'payroll',
      'projects',
      'accounting',
      'ecommerce',
    ],
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
