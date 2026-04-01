import type { ReactElement } from "react";
import { Spin } from "antd";
import { Navigate } from "react-router-dom";

import { MainLayout } from "../../layout/MainLayout";
import { useWorkspace } from "../../state/WorkspaceContext";

export function AuthenticatedShell(): ReactElement {
  const { session, isBooting } = useWorkspace();

  if (isBooting) {
    return (
      <div className="boot-screen">
        <Spin size="large" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <MainLayout />;
}
