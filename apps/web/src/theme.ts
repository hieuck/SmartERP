import type { ThemeConfig } from "antd";
import { theme as antdTheme } from "antd";

export const smartErpTheme: ThemeConfig = {
  algorithm: antdTheme.defaultAlgorithm,
  token: {
    colorPrimary: "#1677ff",
    colorBgLayout: "#f0f2f5",
    colorBgContainer: "#ffffff",
    colorBorderSecondary: "#f0f0f0",
    fontFamily:
      'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    borderRadius: 8,
    borderRadiusLG: 12,
    controlHeight: 38,
    padding: 16,
    paddingLG: 24,
  },
  components: {
    Layout: {
      bodyBg: "#f0f2f5",
      headerBg: "#ffffff",
      siderBg: "#001529",
      triggerBg: "#002140",
      triggerColor: "#ffffff",
    },
    Menu: {
      darkItemBg: "#001529",
      darkItemSelectedBg: "#1677ff",
      itemBorderRadius: 8,
      itemHeight: 40,
    },
    Card: {
      borderRadiusLG: 16,
    },
    Button: {
      borderRadius: 8,
      controlHeight: 38,
    },
    Input: {
      borderRadius: 8,
    },
    Select: {
      borderRadius: 8,
    },
  },
};
