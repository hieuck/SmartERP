import { Layout, Button, Dropdown, Avatar, Space, Breadcrumb } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import { RootState } from '../../store';
import type { MenuProps } from 'antd';

const { Header: AntHeader } = Layout;

interface HeaderProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Header({ collapsed, onToggle }: HeaderProps) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const user = useSelector((state: RootState) => state.auth.user);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Thông Tin Cá Nhân',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng Xuất',
      onClick: handleLogout,
    },
  ];

  // Generate breadcrumb items
  const getBreadcrumbItems = () => {
    const pathSnippets = location.pathname.split('/').filter((i) => i);

    const breadcrumbNameMap: Record<string, string> = {
      products: 'Sản Phẩm',
      inventory: 'Kho Hàng',
      stock: 'Tồn Kho',
      receipts: 'Phiếu Nhập',
      issues: 'Phiếu Xuất',
      customers: 'Khách Hàng',
      suppliers: 'Nhà Cung Cấp',
      new: 'Tạo Mới',
    };

    const items = [
      {
        title: 'Trang Chủ',
        href: '/',
      },
    ];

    pathSnippets.forEach((snippet, index) => {
      const url = `/${pathSnippets.slice(0, index + 1).join('/')}`;
      const isLast = index === pathSnippets.length - 1;

      if (breadcrumbNameMap[snippet]) {
        items.push({
          title: breadcrumbNameMap[snippet],
          href: isLast ? undefined : url,
        });
      }
    });

    return items;
  };

  return (
    <AntHeader
      style={{
        padding: '0 24px',
        background: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 1px 4px rgba(0,21,41,.08)',
      }}
    >
      <Space>
        <Button
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={onToggle}
          style={{ fontSize: 16, width: 64, height: 64 }}
        />
        <Breadcrumb items={getBreadcrumbItems()} />
      </Space>

      <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
        <Space style={{ cursor: 'pointer' }}>
          <Avatar icon={<UserOutlined />} />
          <span>
            {user?.firstName} {user?.lastName}
          </span>
        </Space>
      </Dropdown>
    </AntHeader>
  );
}
