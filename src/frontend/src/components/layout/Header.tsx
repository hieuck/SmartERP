import { Layout, Button, Dropdown, Avatar, Space, Breadcrumb } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/hooks/useTheme';
import { logout } from '@/store/slices/authSlice';
import { RootState } from '@/store';
import LanguageSwitcher from '@/components/common/LanguageSwitcher';
import ThemeToggle from '@/components/common/ThemeToggle';
import { OfflineStatus } from '@/components/OfflineStatus';
import type { MenuProps } from 'antd';

const { Header: AntHeader } = Layout;

interface HeaderProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Header({ collapsed, onToggle }: HeaderProps) {
  const { t } = useTranslation(['layout', 'common']);
  const { theme } = useTheme();
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
      label: t('layout:header.profile'),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: t('layout:header.logout'),
      onClick: handleLogout,
    },
  ];

  // Generate breadcrumb items
  const getBreadcrumbItems = () => {
    const pathSnippets = location.pathname.split('/').filter((i) => i);

    const breadcrumbNameMap: Record<string, string> = {
      products: t('layout:breadcrumb.products'),
      inventory: t('layout:breadcrumb.inventory'),
      stock: t('layout:breadcrumb.stock'),
      receipts: t('layout:breadcrumb.receipts'),
      issues: t('layout:breadcrumb.issues'),
      customers: t('layout:breadcrumb.customers'),
      suppliers: t('layout:breadcrumb.suppliers'),
      new: t('layout:breadcrumb.new'),
      edit: t('layout:breadcrumb.edit'),
    };

    const items = [
      {
        title: t('layout:breadcrumb.home'),
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
        padding: `0 ${theme.token?.paddingLG}px`,
        background: theme.token?.colorBgContainer,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: theme.token?.boxShadowTertiary,
      }}
    >
      <Space>
        <Button
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={onToggle}
          style={{
            fontSize: theme.token?.fontSizeLG,
            width: 64,
            height: 64,
          }}
        />
        <Breadcrumb items={getBreadcrumbItems()} />
      </Space>

      <Space>
        <OfflineStatus />
        <ThemeToggle />
        <LanguageSwitcher />
        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
          <Space style={{ cursor: 'pointer' }}>
            <Avatar icon={<UserOutlined />} />
            <span>
              {user?.firstName} {user?.lastName}
            </span>
          </Space>
        </Dropdown>
      </Space>
    </AntHeader>
  );
}
