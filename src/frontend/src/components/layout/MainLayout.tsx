import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Layout, Drawer } from 'antd';
import Sidebar from './Sidebar';
import Header from './Header';
import { useResponsive } from '@/hooks/useResponsive';
import { useTheme } from '@/hooks/useTheme';
import './MainLayout.css';

const { Content } = Layout;

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const { isMobile, isTablet } = useResponsive();
  const { theme } = useTheme();

  // Auto-collapse sidebar on tablet/mobile
  useEffect(() => {
    if (isMobile || isTablet) {
      setCollapsed(true);
    }
  }, [isMobile, isTablet]);

  const handleToggle = () => {
    if (isMobile) {
      setMobileDrawerOpen(!mobileDrawerOpen);
    } else {
      setCollapsed(!collapsed);
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Desktop/Tablet Sidebar */}
      {!isMobile && <Sidebar collapsed={collapsed} />}

      {/* Mobile Drawer */}
      {isMobile && (
        <Drawer
          placement="left"
          onClose={() => setMobileDrawerOpen(false)}
          open={mobileDrawerOpen}
          styles={{ body: { padding: 0 } }}
          size={256}
        >
          <Sidebar collapsed={false} />
        </Drawer>
      )}

      <Layout>
        <Header collapsed={collapsed} onToggle={handleToggle} />
        <Content
          className="main-content"
          style={{
            padding: isMobile
              ? theme.token?.paddingSM
              : isTablet
                ? theme.token?.padding
                : theme.token?.paddingLG,
            margin: 0,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
