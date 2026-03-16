/**
 * ProtectedRoute Component
 * Wrapper component for routes that require authentication
 */

import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useInactivityLogout } from '@/hooks/useInactivityLogout';

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

  // Enable auto-logout after 30 minutes of inactivity (Requirement 23.3)
  useInactivityLogout();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;
