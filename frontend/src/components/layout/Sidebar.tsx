import { Layout, Menu } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
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

  const items: MenuItem[] = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: '/dashboard/products',
      icon: <ShoppingOutlined />,
      label: 'Sản Phẩm',
    },
    {
      key: '/dashboard/inventory',
      icon: <InboxOutlined />,
      label: 'Kho Hàng',
      children: [
        { key: '/dashboard/inventory/stock', label: 'Tồn Kho' },
        { key: '/dashboard/inventory/receipts', label: 'Phiếu Nhập' },
        { key: '/dashboard/inventory/issues', label: 'Phiếu Xuất' },
      ],
    },
    {
      key: '/dashboard/warehouses',
      icon: <HomeOutlined />,
      label: 'Quản Lý Kho',
      children: [
        { key: '/dashboard/warehouses', label: 'Danh Sách Kho' },
        { key: '/dashboard/warehouses/transfers', label: 'Chuyển Kho' },
        { key: '/dashboard/warehouses/stock-report', label: 'Báo Cáo Tồn Kho' },
      ],
    },
    {
      key: '/dashboard/orders',
      icon: <ShoppingCartOutlined />,
      label: 'Đơn Hàng',
      children: [
        { key: '/dashboard/orders/sales', label: 'Đơn Bán Hàng' },
        { key: '/dashboard/orders/purchase', label: 'Đơn Mua Hàng' },
        { key: '/dashboard/orders/payments', label: 'Thanh Toán' },
      ],
    },
    {
      key: '/dashboard/customers',
      icon: <UserOutlined />,
      label: 'Khách Hàng',
    },
    {
      key: '/dashboard/suppliers',
      icon: <TeamOutlined />,
      label: 'Nhà Cung Cấp',
    },
    {
      key: '/dashboard/production',
      icon: <ToolOutlined />,
      label: 'Sản Xuất',
      children: [
        { key: '/dashboard/production/workers', label: 'Nhân Viên SX' },
        { key: '/dashboard/production/attendance', label: 'Chấm Công' },
        { key: '/dashboard/production/piecework', label: 'Chấm Công Khoán' },
        { key: '/dashboard/production/shifts', label: 'Ca Làm Việc' },
        { key: '/dashboard/production/payroll', label: 'Tính Lương' },
        { key: '/dashboard/production/advances', label: 'Tạm Ứng' },
        { key: '/dashboard/production/materials', label: 'Nguyên Vật Liệu' },
        { key: '/dashboard/production/molds', label: 'Khuôn Mẫu' },
        { key: '/dashboard/production/orders', label: 'Lệnh Sản Xuất' },
        { key: '/dashboard/production/reports', label: 'Báo Cáo SX' },
      ],
    },
    {
      key: '/dashboard/promotions',
      icon: <GiftOutlined />,
      label: 'Khuyến Mãi',
    },
    {
      key: '/dashboard/reports',
      icon: <BarChartOutlined />,
      label: 'Báo Cáo',
    },
    {
      key: '/dashboard/notifications',
      icon: <BellOutlined />,
      label: 'Thông Báo',
      children: [
        { key: '/dashboard/notifications', label: 'Danh Sách' },
        { key: '/dashboard/notifications/preferences', label: 'Cài Đặt' },
      ],
    },
    {
      key: '/dashboard/search',
      icon: <SearchOutlined />,
      label: 'Tìm Kiếm',
    },
    {
      key: '/dashboard/users',
      icon: <TeamOutlined />,
      label: 'Nhân Viên',
    },
    {
      key: '/dashboard/tenancy',
      icon: <ApartmentOutlined />,
      label: 'Quản Lý Tenant',
    },
    {
      key: '/dashboard/settings',
      icon: <SettingOutlined />,
      label: 'Cài Đặt',
      children: [{ key: '/dashboard/settings/print', label: 'Mẫu In' }],
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
    if (path.startsWith('/dashboard/warehouses/transfers')) return '/dashboard/warehouses/transfers';
    if (path.startsWith('/dashboard/warehouses/stock-report')) return '/dashboard/warehouses/stock-report';
    if (path.startsWith('/dashboard/warehouses')) return '/dashboard/warehouses';
    if (path.startsWith('/dashboard/orders/sales')) return '/dashboard/orders/sales';
    if (path.startsWith('/dashboard/orders/purchase')) return '/dashboard/orders/purchase';
    if (path.startsWith('/dashboard/orders/payments')) return '/dashboard/orders/payments';
    if (path.startsWith('/dashboard/production/workers')) return '/dashboard/production/workers';
    if (path.startsWith('/dashboard/production/attendance')) return '/dashboard/production/attendance';
    if (path.startsWith('/dashboard/production/piecework')) return '/dashboard/production/piecework';
    if (path.startsWith('/dashboard/production/shifts')) return '/dashboard/production/shifts';
    if (path.startsWith('/dashboard/production/payroll')) return '/dashboard/production/payroll';
    if (path.startsWith('/dashboard/production/advances')) return '/dashboard/production/advances';
    if (path.startsWith('/dashboard/production/materials')) return '/dashboard/production/materials';
    if (path.startsWith('/dashboard/production/molds')) return '/dashboard/production/molds';
    if (path.startsWith('/dashboard/production/orders')) return '/dashboard/production/orders';
    if (path.startsWith('/dashboard/production/reports')) return '/dashboard/production/reports';
    if (path.startsWith('/dashboard/promotions')) return '/dashboard/promotions';
    if (path.startsWith('/dashboard/notifications/preferences')) return '/dashboard/notifications/preferences';
    if (path.startsWith('/dashboard/notifications')) return '/dashboard/notifications';
    if (path.startsWith('/dashboard/search')) return '/dashboard/search';
    if (path.startsWith('/dashboard/tenancy')) return '/dashboard/tenancy';
    if (path.startsWith('/dashboard/products')) return '/dashboard/products';
    if (path.startsWith('/dashboard/customers')) return '/dashboard/customers';
    if (path.startsWith('/dashboard/suppliers')) return '/dashboard/suppliers';
    if (path.startsWith('/dashboard/reports')) return '/dashboard/reports';
    if (path.startsWith('/dashboard/users')) return '/dashboard/users';
    if (path.startsWith('/dashboard/settings/print')) return '/dashboard/settings/print';
    return '/dashboard';
  };

  // Get open keys for submenu
  const getOpenKeys = () => {
    const path = location.pathname;
    if (path.startsWith('/dashboard/inventory')) return ['/dashboard/inventory'];
    if (path.startsWith('/dashboard/warehouses')) return ['/dashboard/warehouses'];
    if (path.startsWith('/dashboard/orders')) return ['/dashboard/orders'];
    if (path.startsWith('/dashboard/production')) return ['/dashboard/production'];
    if (path.startsWith('/dashboard/notifications')) return ['/dashboard/notifications'];
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
        {collapsed ? 'ERP' : 'Plaster ERP'}
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
