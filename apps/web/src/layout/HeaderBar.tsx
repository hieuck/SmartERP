import {
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
} from "@ant-design/icons";
import type { ReactElement } from "react";
import { Avatar, Breadcrumb, Button, Dropdown, Layout, Segmented, Space, Tag } from "antd";
import type { MenuProps } from "antd";
import { useLocation, useNavigate } from "react-router-dom";

import { useLocale } from "../locale/LocaleContext";
import { useWorkspace } from "../state/WorkspaceContext";

const { Header } = Layout;

type HeaderBarProps = {
  collapsed: boolean;
  onToggle: () => void;
};

export function HeaderBar({ collapsed, onToggle }: HeaderBarProps): ReactElement {
  const location = useLocation();
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLocale();
  const { session, selectedTenant, logoutFromWorkspace } = useWorkspace();
  const labels: Record<string, string> = {
    dashboard: t("shell.dashboard"),
    tenants: t("shell.tenants"),
    customers: t("shell.customers"),
    suppliers: t("shell.suppliers"),
    products: t("shell.products"),
    "purchase-orders": t("shell.purchaseOrders"),
    orders: t("shell.orders"),
    inventory: t("shell.inventory"),
    invoices: t("shell.invoices"),
    reports: t("shell.reports"),
    approvals: t("shell.approvals"),
  };

  const breadcrumbItems = location.pathname
    .split("/")
    .filter(Boolean)
    .map((segment, index, all) => ({
      title: labels[segment] ?? segment,
      href: index === all.length - 1 ? "" : `/${all.slice(0, index + 1).join("/")}`,
    }));

  const userMenuItems: MenuProps["items"] = [
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: t("shell.signOut"),
      onClick: () => {
        logoutFromWorkspace();
        navigate("/login");
      },
    },
  ];

  return (
    <Header className="shell-header">
      <Space>
        <Button
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={onToggle}
          style={{ width: 48, height: 48 }}
        />
        <Breadcrumb items={breadcrumbItems} />
      </Space>

      <Space size="middle">
        <Space className="header-language" size="small">
          <span className="header-language-label">{t("common.language")}</span>
          <Segmented
            options={[
              { label: t("common.vietnameseShort"), value: "vi" },
              { label: t("common.englishShort"), value: "en" },
            ]}
            size="small"
            value={language}
            onChange={(value) => setLanguage(value as "vi" | "en")}
          />
        </Space>
        {selectedTenant ? <Tag color="blue">{selectedTenant.name}</Tag> : null}
        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
          <Space className="header-user">
            <Avatar icon={<UserOutlined />} />
            <span>{session?.displayName ?? t("common.workspace")}</span>
          </Space>
        </Dropdown>
      </Space>
    </Header>
  );
}
