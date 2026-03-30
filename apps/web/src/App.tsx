import type { ReactElement } from "react";

import { App as AntApp, ConfigProvider } from "antd";
import { BrowserRouter } from "react-router-dom";

import { LocaleProvider, useLocale } from "./locale/LocaleContext";
import { AppRoutes } from "./routes";
import { WorkspaceProvider } from "./state/WorkspaceContext";
import { smartErpTheme } from "./theme";

function LocalizedApp(): ReactElement {
  const { antdLocale } = useLocale();

  return (
    <ConfigProvider theme={smartErpTheme} locale={antdLocale}>
      <AntApp>
        <WorkspaceProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </WorkspaceProvider>
      </AntApp>
    </ConfigProvider>
  );
}

export function App(): ReactElement {
  return (
    <LocaleProvider>
      <LocalizedApp />
    </LocaleProvider>
  );
}
