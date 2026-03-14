import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enCommon from './locales/en/common.json';
import enAuth from './locales/en/auth.json';
import enDashboard from './locales/en/dashboard.json';
import enProducts from './locales/en/products.json';
import enOrders from './locales/en/orders.json';
import enCustomers from './locales/en/customers.json';
import enInventory from './locales/en/inventory.json';
import enWarehouses from './locales/en/warehouses.json';
import enSuppliers from './locales/en/suppliers.json';
import enPayments from './locales/en/payments.json';
import enInvoices from './locales/en/invoices.json';
import enUsers from './locales/en/users.json';
import enProduction from './locales/en/production.json';
import enReports from './locales/en/reports.json';
import enSettings from './locales/en/settings.json';
import enNotifications from './locales/en/notifications.json';
import enLayout from './locales/en/layout.json';

import viCommon from './locales/vi/common.json';
import viAuth from './locales/vi/auth.json';
import viDashboard from './locales/vi/dashboard.json';
import viProducts from './locales/vi/products.json';
import viOrders from './locales/vi/orders.json';
import viCustomers from './locales/vi/customers.json';
import viInventory from './locales/vi/inventory.json';
import viWarehouses from './locales/vi/warehouses.json';
import viSuppliers from './locales/vi/suppliers.json';
import viPayments from './locales/vi/payments.json';
import viInvoices from './locales/vi/invoices.json';
import viUsers from './locales/vi/users.json';
import viProduction from './locales/vi/production.json';
import viReports from './locales/vi/reports.json';
import viSettings from './locales/vi/settings.json';
import viNotifications from './locales/vi/notifications.json';
import viLayout from './locales/vi/layout.json';
import viCommonUi from './locales/vi/common-ui.json';

import enCommonUi from './locales/en/common-ui.json';

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
