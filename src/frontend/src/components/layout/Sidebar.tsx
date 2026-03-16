import { Layout, Menu } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  DashboardOutlined,
  ShoppingOutlined,
  InboxOutlined,
  UserOutlined,
  TeamOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  BarChartOutlined,
  SettingOutlined,
  ToolOutlined,
  GiftOutlined,
  BellOutlined,
  SearchOutlined,
  ApartmentOutlined,
  HomeOutlined,
  CloudSyncOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';

const { Sider } = Layout;

interface SidebarProps {
  collapsed: boolean;
}

type MenuItem = Required<MenuProps>['items'][number];

export default function Sidebar({ collapsed }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation('layout');

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
      key: '/dashboard/production',
      icon: <ToolOutlined />,
      label: t('sidebar.production'),
      children: [
        { key: '/dashboard/production/workers', label: t('sidebar.workers') },
        { key: '/dashboard/production/attendance', label: t('sidebar.attendance') },
        { key: '/dashboard/production/piecework', label: t('sidebar.piecework') },
        { key: '/dashboard/production/shifts', label: t('sidebar.shifts') },
        { key: '/dashboard/production/payroll', label: t('sidebar.payroll') },
        { key: '/dashboard/production/advances', label: t('sidebar.advances') },
        { key: '/dashboard/production/materials', label: t('sidebar.materials') },
        { key: '/dashboard/production/molds', label: t('sidebar.molds') },
        { key: '/dashboard/production/orders', label: t('sidebar.productionOrders') },
        { key: '/dashboard/production/reports', label: t('sidebar.productionReports') },
      ],
    },
    {
      key: '/dashboard/promotions',
      icon: <GiftOutlined />,
      label: t('sidebar.promotions'),
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
        { key: '/dashboard/notifications/preferences', label: t('sidebar.notificationPreferences') },
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
      key: '/dashboard/tenancy',
      icon: <ApartmentOutlined />,
      label: t('sidebar.tenancy'),
    },
    {
      key: '/dashboard/settings',
      icon: <SettingOutlined />,
      label: t('sidebar.settings'),
      children: [{ key: '/dashboard/settings/print', label: t('sidebar.printTemplates') }],
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
    if (path.startsWith('/dashboard/production/workers')) return '/dashboard/production/workers';
    if (path.startsWith('/dashboard/production/attendance'))
      return '/dashboard/production/attendance';
    if (path.startsWith('/dashboard/production/piecework'))
      return '/dashboard/production/piecework';
    if (path.startsWith('/dashboard/production/shifts')) return '/dashboard/production/shifts';
    if (path.startsWith('/dashboard/production/payroll')) return '/dashboard/production/payroll';
    if (path.startsWith('/dashboard/production/advances')) return '/dashboard/production/advances';
    if (path.startsWith('/dashboard/production/materials'))
      return '/dashboard/production/materials';
    if (path.startsWith('/dashboard/production/molds')) return '/dashboard/production/molds';
    if (path.startsWith('/dashboard/production/orders')) return '/dashboard/production/orders';
    if (path.startsWith('/dashboard/production/reports')) return '/dashboard/production/reports';
    if (path.startsWith('/dashboard/promotions')) return '/dashboard/promotions';
    if (path.startsWith('/dashboard/notifications/preferences'))
      return '/dashboard/notifications/preferences';
    if (path.startsWith('/dashboard/notifications')) return '/dashboard/notifications/list';
    if (path.startsWith('/dashboard/search')) return '/dashboard/search';
    if (path.startsWith('/dashboard/tenancy')) return '/dashboard/tenancy';
    if (path.startsWith('/dashboard/products')) return '/dashboard/products';
    if (path.startsWith('/dashboard/customers')) return '/dashboard/customers';
    if (path.startsWith('/dashboard/suppliers')) return '/dashboard/suppliers';
    if (path.startsWith('/dashboard/reports')) return '/dashboard/reports';
    if (path.startsWith('/dashboard/users')) return '/dashboard/users';
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
    if (path.startsWith('/dashboard/production')) return ['/dashboard/production'];
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
          color: '#fff',
          fontSize: collapsed ? 16 : 20,
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
