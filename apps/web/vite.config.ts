import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      "/api": "http://localhost:4000",
    },
  },
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalizedId = id.replaceAll("\\", "/");

          if (!normalizedId.includes("/node_modules/")) {
            return undefined;
          }

          if (
            normalizedId.includes("/react/") ||
            normalizedId.includes("/react-dom/") ||
            normalizedId.includes("/scheduler/")
          ) {
            return "react-vendor";
          }

          if (normalizedId.includes("/@ant-design/icons-svg/")) {
            return "icons-vendor";
          }

          if (
            normalizedId.includes("/rc-util/") ||
            normalizedId.includes("/rc-motion/") ||
            normalizedId.includes("/rc-resize-observer/")
          ) {
            return "antd-rc-core-vendor";
          }

          if (
            normalizedId.includes("/rc-field-form/") ||
            normalizedId.includes("/rc-input/") ||
            normalizedId.includes("/rc-textarea/") ||
            normalizedId.includes("/rc-select/") ||
            normalizedId.includes("/rc-trigger/") ||
            normalizedId.includes("/rc-virtual-list/")
          ) {
            return "antd-forms-vendor";
          }

          if (
            normalizedId.includes("/rc-menu/") ||
            normalizedId.includes("/rc-drawer/") ||
            normalizedId.includes("/rc-overflow/")
          ) {
            return "antd-shell-vendor";
          }

          if (
            normalizedId.includes("/antd/") ||
            normalizedId.includes("/@ant-design/") ||
            normalizedId.includes("/rc-")
          ) {
            return "antd-vendor";
          }

          if (
            normalizedId.includes("/react-router/") ||
            normalizedId.includes("/react-router-dom/")
          ) {
            return "router-vendor";
          }

          return undefined;
        },
      },
    },
  },
});
