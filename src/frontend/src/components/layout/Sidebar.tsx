import { useTheme } from '@/hooks/useTheme';
import {
  ApartmentOutlined,
  AuditOutlined,
  BarChartOutlined,
  BellOutlined,
  BookOutlined,
  CloudSyncOutlined,
  DashboardOutlined,
  HomeOutlined,
  IdcardOutlined,
  InboxOutlined,
  ProjectOutlined,
  SearchOutlined,
  SettingOutlined,
  ShoppingCartOutlined,
  ShoppingOutlined,
  TeamOutlined,
  ToolOutlined,
  UserOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Layout, Menu } from 'antd';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';

const { Sider } = Layout;

interface SidebarProps {
  collapsed: boolean;
}

type MenuItem = Required<MenuProps>['items'][number];

export default function Sidebar({ collapsed }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation('layout');
  const { theme } = useTheme();

  const items: MenuItem[] = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: t('sidebar.dashboard'),
    },
    {
      key: '/dashboard/products',
      icon: <ShoppingOutlined />,
      label: t('sidebar.products'),
    },
    {
      key: '/dashboard/inventory',
      icon: <InboxOutlined />,
      label: t('sidebar.inventory'),
      children: [
        { key: '/dashboard/inventory/stock', label: t('sidebar.stock') },
        { key: '/dashboard/inventory/receipts', label: t('sidebar.receipts') },
        { key: '/dashboard/inventory/issues', label: t('sidebar.issues') },
      ],
    },
    {
      key: 'menu-warehouses',
      icon: <HomeOutlined />,
      label: t('sidebar.warehouses'),
      children: [
        { key: '/dashboard/warehouses/list', label: t('sidebar.warehouseList') },
        { key: '/dashboard/warehouses/transfers', label: t('sidebar.transfers') },
        { key: '/dashboard/warehouses/stock-report', label: t('sidebar.stockReport') },
      ],
    },
    {
      key: '/dashboard/orders',
      icon: <ShoppingCartOutlined />,
      label: t('sidebar.orders'),
      children: [
        { key: '/dashboard/orders/sales', label: t('sidebar.salesOrders') },
        { key: '/dashboard/orders/purchase', label: t('sidebar.purchaseOrders') },
        { key: '/dashboard/orders/payments', label: t('sidebar.payments') },
      ],
    },
    {
      key: '/dashboard/customers',
      icon: <UserOutlined />,
      label: t('sidebar.customers'),
    },
    {
      key: '/dashboard/suppliers',
      icon: <TeamOutlined />,
      label: t('sidebar.suppliers'),
    },
    {
      key: 'menu-production',
      icon: <ToolOutlined />,
      label: t('sidebar.production'),
      children: [
        { key: '/dashboard/production/work-orders', label: t('sidebar.workOrders') },
        { key: '/dashboard/production/bom', label: t('sidebar.bom') },
        { key: '/dashboard/production/work-centers', label: t('sidebar.workCenters') },
      ],
    },
    {
      key: 'menu-hr',
      icon: <IdcardOutlined />,
      label: t('sidebar.hr'),
      children: [
        { key: '/dashboard/hr/attendance', label: t('sidebar.attendance') },
        { key: '/dashboard/hr/employees', label: t('sidebar.employees') },
        { key: '/dashboard/hr/leave', label: t('sidebar.leave') },
        { key: '/dashboard/hr/payroll', label: t('sidebar.payroll') },
      ],
    },
    {
      key: 'menu-projects',
      icon: <ProjectOutlined />,
      label: t('sidebar.projects'),
      children: [{ key: '/dashboard/projects', label: t('sidebar.projects') }],
    },
    {
      key: 'menu-accounting',
      icon: <BookOutlined />,
      label: t('sidebar.accounting'),
      children: [
        { key: '/dashboard/accounting/accounts', label: t('sidebar.chartOfAccounts') },
        { key: '/dashboard/accounting/journal-entries', label: t('sidebar.journalEntries') },
      ],
    },
    {
      key: 'menu-ecommerce',
      icon: <ShoppingOutlined />,
      label: t('sidebar.ecommerce'),
      children: [
        { key: '/dashboard/ecommerce/products', label: t('sidebar.ecommerceProducts') },
        { key: '/dashboard/ecommerce/orders', label: t('sidebar.ecommerceOrders') },
      ],
    },
    {
      key: '/dashboard/reports',
      icon: <BarChartOutlined />,
      label: t('sidebar.reports'),
    },
    {
      key: 'menu-notifications',
      icon: <BellOutlined />,
      label: t('sidebar.notifications'),
      children: [
        { key: '/dashboard/notifications/list', label: t('sidebar.notificationList') },
        {
          key: '/dashboard/notifications/preferences',
          label: t('sidebar.notificationPreferences'),
        },
      ],
    },
    {
      key: '/dashboard/search',
      icon: <SearchOutlined />,
      label: t('sidebar.search'),
    },
    {
      key: '/dashboard/users',
      icon: <TeamOutlined />,
      label: t('sidebar.users'),
    },
    {
      key: '/dashboard/audit',
      icon: <AuditOutlined />,
      label: t('sidebar.audit'),
    },
    {
      key: '/dashboard/tenancy',
      icon: <ApartmentOutlined />,
      label: t('sidebar.tenancy'),
    },
    {
      key: '/dashboard/settings',
      icon: <SettingOutlined />,
      label: t('sidebar.settings'),
      children: [
        { key: '/dashboard/settings/system', label: t('sidebar.systemSettings') },
        { key: '/dashboard/settings/print', label: t('sidebar.printTemplates') },
      ],
    },
    {
      key: '/dashboard/offline-demo',
      icon: <CloudSyncOutlined />,
      label: 'Offline Demo',
    },
  ];

  const handleMenuClick: MenuProps['onClick'] = (e) => {
    navigate(e.key);
  };

  // Get current selected key
  const getSelectedKey = () => {
    const path = location.pathname;
    if (path.startsWith('/dashboard/inventory/receipts')) return '/dashboard/inventory/receipts';
    if (path.startsWith('/dashboard/inventory/issues')) return '/dashboard/inventory/issues';
    if (path.startsWith('/dashboard/inventory')) return '/dashboard/inventory/stock';
    if (path.startsWith('/dashboard/warehouses/transfers'))
      return '/dashboard/warehouses/transfers';
    if (path.startsWith('/dashboard/warehouses/stock-report'))
      return '/dashboard/warehouses/stock-report';
    if (path.startsWith('/dashboard/warehouses')) return '/dashboard/warehouses/list';
    if (path.startsWith('/dashboard/orders/sales')) return '/dashboard/orders/sales';
    if (path.startsWith('/dashboard/orders/purchase')) return '/dashboard/orders/purchase';
    if (path.startsWith('/dashboard/orders/payments')) return '/dashboard/orders/payments';
    if (path.startsWith('/dashboard/production/work-orders'))
      return '/dashboard/production/work-orders';
    if (path.startsWith('/dashboard/production/bom')) return '/dashboard/production/bom';
    if (path.startsWith('/dashboard/production/work-centers'))
      return '/dashboard/production/work-centers';
    if (path.startsWith('/dashboard/hr/attendance')) return '/dashboard/hr/attendance';
    if (path.startsWith('/dashboard/hr/employees')) return '/dashboard/hr/employees';
    if (path.startsWith('/dashboard/hr/leave')) return '/dashboard/hr/leave';
    if (path.startsWith('/dashboard/hr/payroll')) return '/dashboard/hr/payroll';
    if (path.startsWith('/dashboard/projects')) return '/dashboard/projects';
    if (path.startsWith('/dashboard/accounting/accounts')) return '/dashboard/accounting/accounts';
    if (path.startsWith('/dashboard/accounting/journal-entries'))
      return '/dashboard/accounting/journal-entries';
    if (path.startsWith('/dashboard/ecommerce/products')) return '/dashboard/ecommerce/products';
    if (path.startsWith('/dashboard/ecommerce/orders')) return '/dashboard/ecommerce/orders';
    if (path.startsWith('/dashboard/notifications/preferences'))
      return '/dashboard/notifications/preferences';
    if (path.startsWith('/dashboard/notifications')) return '/dashboard/notifications/list';
    if (path.startsWith('/dashboard/search')) return '/dashboard/search';
    if (path.startsWith('/dashboard/tenancy')) return '/dashboard/tenancy';
    if (path.startsWith('/dashboard/audit')) return '/dashboard/audit';
    if (path.startsWith('/dashboard/products')) return '/dashboard/products';
    if (path.startsWith('/dashboard/customers')) return '/dashboard/customers';
    if (path.startsWith('/dashboard/suppliers')) return '/dashboard/suppliers';
    if (path.startsWith('/dashboard/reports')) return '/dashboard/reports';
    if (path.startsWith('/dashboard/users')) return '/dashboard/users';
    if (path.startsWith('/dashboard/settings/system')) return '/dashboard/settings/system';
    if (path.startsWith('/dashboard/settings/print')) return '/dashboard/settings/print';
    if (path.startsWith('/dashboard/offline-demo')) return '/dashboard/offline-demo';
    return '/dashboard';
  };

  // Get open keys for submenu
  const getOpenKeys = () => {
    const path = location.pathname;
    if (path.startsWith('/dashboard/inventory')) return ['/dashboard/inventory'];
    if (path.startsWith('/dashboard/warehouses')) return ['menu-warehouses'];
    if (path.startsWith('/dashboard/orders')) return ['/dashboard/orders'];
    if (path.startsWith('/dashboard/production')) return ['menu-production'];
    if (path.startsWith('/dashboard/hr')) return ['menu-hr'];
    if (path.startsWith('/dashboard/projects')) return ['menu-projects'];
    if (path.startsWith('/dashboard/accounting')) return ['menu-accounting'];
    if (path.startsWith('/dashboard/ecommerce')) return ['menu-ecommerce'];
    if (path.startsWith('/dashboard/notifications')) return ['menu-notifications'];
    if (path.startsWith('/dashboard/settings')) return ['/dashboard/settings'];
    return [];
  };

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      trigger={null}
      breakpoint="lg"
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'sticky',
        top: 0,
        left: 0,
      }}
    >
      <div
        style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: theme.token?.colorTextLightSolid,
          fontSize: collapsed ? theme.token?.fontSize : theme.token?.fontSizeHeading5,
          fontWeight: 'bold',
        }}
      >
        {collapsed ? 'ERP' : 'SmartERP'}
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[getSelectedKey()]}
        defaultOpenKeys={getOpenKeys()}
        items={items}
        onClick={handleMenuClick}
      />
    </Sider>
  );
}
