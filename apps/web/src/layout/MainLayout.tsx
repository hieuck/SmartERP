import type { ReactElement } from "react";
import { useEffect, useState } from "react";
import { Drawer, Grid, Layout } from "antd";
import { Outlet } from "react-router-dom";

import { HeaderBar } from "./HeaderBar";
import { Sidebar } from "./Sidebar";

const { Content } = Layout;
const { useBreakpoint } = Grid;

export function MainLayout(): ReactElement {
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const isTablet = !!screens.md && !screens.lg;

  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  useEffect(() => {
    if (isMobile || isTablet) {
      setCollapsed(true);
    }
  }, [isMobile, isTablet]);

  function handleToggle(): void {
    if (isMobile) {
      setMobileDrawerOpen((current) => !current);
      return;
    }

    setCollapsed((current) => !current);
  }

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {!isMobile ? <Sidebar collapsed={collapsed} /> : null}

      {isMobile ? (
        <Drawer
          placement="left"
          onClose={() => setMobileDrawerOpen(false)}
          open={mobileDrawerOpen}
          styles={{ body: { padding: 0 } }}
          size={256}
        >
          <Sidebar collapsed={false} />
        </Drawer>
      ) : null}

      <Layout>
        <HeaderBar collapsed={collapsed} onToggle={handleToggle} />
        <Content className="shell-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
