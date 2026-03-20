/**
 * ProtectedRoute Component
 * Wrapper component for routes that require authentication
 */

import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useSessionTimeout } from '@/hooks/useSessionTimeout';

export interface ProtectedRouteProps {
  children: ReactNode;
}

/**
 * Protected route wrapper that redirects to login if not authenticated
 * Also enables auto-logout after 30 minutes of inactivity (Requirement 23.3)
 * 
 * @param {ProtectedRouteProps} props - Component props
 * @returns {JSX.Element} Protected route or redirect to login
 * 
 * @example
 * ```tsx
 * <Route
 *   path="/dashboard"
 *   element={
 *     <ProtectedRoute>
 *       <Dashboard />
 *     </ProtectedRoute>
 *   }
 * />
 * ```
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  useSessionTimeout({ enabled: isAuthenticated });

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;
