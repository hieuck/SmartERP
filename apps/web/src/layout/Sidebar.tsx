import {
  ApartmentOutlined,
  BarChartOutlined,
  ControlOutlined,
  DatabaseOutlined,
  DashboardOutlined,
  FileTextOutlined,
  FlagOutlined,
  InboxOutlined,
  SafetyCertificateOutlined,
  ShoppingCartOutlined,
  ShoppingOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import type { ReactElement } from "react";
import { Layout, Menu } from "antd";
import type { MenuProps } from "antd";
import { useLocation, useNavigate } from "react-router-dom";

import { useLocale } from "../locale/LocaleContext";
import { useWorkspace } from "../state/WorkspaceContext";

const { Sider } = Layout;

type SidebarProps = {
  collapsed: boolean;
};

type MenuItem = Required<MenuProps>["items"][number];

export function Sidebar({ collapsed }: SidebarProps): ReactElement {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLocale();
  const { canAccessModule } = useWorkspace();
  const items: MenuItem[] = [
    { key: "/dashboard", icon: <DashboardOutlined />, label: t("shell.dashboard") },
    canAccessModule("setup")
      ? { key: "/dashboard/setup", icon: <FlagOutlined />, label: t("shell.setup") }
      : null,
    canAccessModule("tenant")
      ? { key: "/dashboard/tenants", icon: <ApartmentOutlined />, label: t("shell.tenants") }
      : null,
    canAccessModule("customers")
      ? { key: "/dashboard/customers", icon: <UserOutlined />, label: t("shell.customers") }
      : null,
    canAccessModule("suppliers")
      ? { key: "/dashboard/suppliers", icon: <TeamOutlined />, label: t("shell.suppliers") }
      : null,
    canAccessModule("products")
      ? { key: "/dashboard/products", icon: <ShoppingOutlined />, label: t("shell.products") }
      : null,
    canAccessModule("purchasing")
      ? { key: "/dashboard/purchase-orders", icon: <ShoppingCartOutlined />, label: t("shell.purchaseOrders") }
      : null,
    canAccessModule("inventory")
      ? { key: "/dashboard/inventory", icon: <DatabaseOutlined />, label: t("shell.inventory") }
      : null,
    canAccessModule("orders")
      ? { key: "/dashboard/orders", icon: <InboxOutlined />, label: t("shell.orders") }
      : null,
    canAccessModule("invoices")
      ? { key: "/dashboard/invoices", icon: <FileTextOutlined />, label: t("shell.invoices") }
      : null,
    canAccessModule("reporting")
      ? { key: "/dashboard/reports", icon: <BarChartOutlined />, label: t("shell.reports") }
      : null,
    canAccessModule("approvals")
      ? { key: "/dashboard/approvals", icon: <SafetyCertificateOutlined />, label: t("shell.approvals") }
      : null,
    canAccessModule("operations")
      ? { key: "/dashboard/operations", icon: <ControlOutlined />, label: t("shell.operations") }
      : null,
  ].filter(Boolean) as MenuItem[];

  function getSelectedKey(): string {
    const path = location.pathname;
    if (path.startsWith("/dashboard/setup")) return "/dashboard/setup";
    if (path.startsWith("/dashboard/tenants")) return "/dashboard/tenants";
    if (path.startsWith("/dashboard/customers")) return "/dashboard/customers";
    if (path.startsWith("/dashboard/suppliers")) return "/dashboard/suppliers";
    if (path.startsWith("/dashboard/products")) return "/dashboard/products";
    if (path.startsWith("/dashboard/purchase-orders")) return "/dashboard/purchase-orders";
    if (path.startsWith("/dashboard/inventory")) return "/dashboard/inventory";
    if (path.startsWith("/dashboard/orders")) return "/dashboard/orders";
    if (path.startsWith("/dashboard/invoices")) return "/dashboard/invoices";
    if (path.startsWith("/dashboard/reports")) return "/dashboard/reports";
    if (path.startsWith("/dashboard/approvals")) return "/dashboard/approvals";
    if (path.startsWith("/dashboard/operations")) return "/dashboard/operations";
    return "/dashboard";
  }

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      trigger={null}
      breakpoint="lg"
      style={{
        overflow: "auto",
        height: "100vh",
        position: "sticky",
        top: 0,
        left: 0,
      }}
    >
      <div className="shell-brand">{collapsed ? "ERP" : t("shell.brand")}</div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[getSelectedKey()]}
        items={items}
        onClick={(event) => navigate(event.key)}
      />
    </Sider>
  );
}
