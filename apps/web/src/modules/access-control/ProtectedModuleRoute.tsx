import type { ReactElement } from "react";

import type { FoundationModule } from "@smarterp/contracts";

import { useWorkspace } from "../../state/WorkspaceContext";
import { AccessDeniedPage } from "./AccessDeniedPage";

type ProtectedModuleRouteProps = {
  module: FoundationModule;
  element: ReactElement;
};

export function ProtectedModuleRoute({
  module,
  element,
}: ProtectedModuleRouteProps): ReactElement {
  const { canAccessModule } = useWorkspace();

  if (!canAccessModule(module)) {
    return <AccessDeniedPage module={module} />;
  }

  return element;
}
