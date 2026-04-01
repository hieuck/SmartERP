import type { PropsWithChildren, ReactElement } from "react";
import { Suspense } from "react";
import { Spin } from "antd";

function RouteFallback(): ReactElement {
  return (
    <div className="boot-screen">
      <Spin size="large" />
    </div>
  );
}

export function RouteBoundary({ children }: PropsWithChildren): ReactElement {
  return <Suspense fallback={<RouteFallback />}>{children}</Suspense>;
}
