import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Layout, message, Drawer } from 'antd';
import { useDispatch } from 'react-redux';
import Sidebar from './Sidebar';
import Header from './Header';
import { logout } from '../../store/slices/authSlice';
import { useResponsive } from '../../hooks/useResponsive';
import './MainLayout.css';

const { Content } = Layout;

let logoutTimer: NodeJS.Timeout;

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isMobile, isTablet } = useResponsive();

  // Auto-collapse sidebar on tablet/mobile
  useEffect(() => {
    if (isMobile || isTablet) {
      setCollapsed(true);
    }
  }, [isMobile, isTablet]);

  // Auto-logout after 30 minutes of inactivity
  useEffect(() => {
    const resetTimer = () => {
      if (logoutTimer) clearTimeout(logoutTimer);

      logoutTimer = setTimeout(
        () => {
          message.warning('Phiên đăng nhập đã hết hạn');
          dispatch(logout());
          navigate('/login');
        },
        30 * 60 * 1000,
      ); // 30 minutes
    };

    // Reset timer on user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach((event) => {
      document.addEventListener(event, resetTimer);
    });

    resetTimer();

    return () => {
      if (logoutTimer) clearTimeout(logoutTimer);
      events.forEach((event) => {
        document.removeEventListener(event, resetTimer);
      });
    };
  }, [dispatch, navigate]);

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
          bodyStyle={{ padding: 0 }}
          width={256}
        >
          <Sidebar collapsed={false} />
        </Drawer>
      )}
      
      <Layout>
        <Header collapsed={collapsed} onToggle={handleToggle} />
        <Content 
          className="main-content"
          style={{
            padding: isMobile ? '12px' : isTablet ? '16px' : '24px',
            margin: 0,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
