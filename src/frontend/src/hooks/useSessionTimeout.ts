import { useEffect, useRef } from 'react';
import { authService } from '@/services/auth/authService';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { clearCredentials } from '@/store/slices/authSlice';
import { RootState } from '@/store';

interface UseSessionTimeoutConfig {
  timeoutMs?: number; // Default: 30 minutes
  warningMs?: number; // Show warning before timeout (default: 5 minutes before)
}

/**
 * Hook for automatic logout after inactivity
 * Tracks user activity (mouse, keyboard, scroll, touch)
 * Logs out user after specified timeout period
 *
 * Usage:
 * useSessionTimeout({ timeoutMs: 30 * 60 * 1000 });
 */
export const useSessionTimeout = (config: UseSessionTimeoutConfig = {}) => {
  const timeoutMs = config.timeoutMs || 30 * 60 * 1000; // 30 minutes
  const warningMs = config.warningMs || 5 * 60 * 1000; // 5 minutes before timeout

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const resetTimeout = () => {
    // Clear existing timeouts
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);

    lastActivityRef.current = Date.now();

    // Set warning timeout
    warningTimeoutRef.current = setTimeout(() => {
      console.warn('Session will expire soon due to inactivity');
      // Could dispatch action to show warning modal here
    }, timeoutMs - warningMs);

    // Set logout timeout
    timeoutRef.current = setTimeout(() => {
      // Session expired due to inactivity
      void authService.logout();
      dispatch(clearCredentials());
      navigate('/login', { replace: true });
    }, timeoutMs);
  };

  useEffect(() => {
    if (!isAuthenticated) {
      // Clear timeouts when user logs out
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
      return;
    }

    // Activity event listeners
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

    const handleActivity = () => {
      resetTimeout();
    };

    // Add event listeners
    activityEvents.forEach((event) => {
      document.addEventListener(event, handleActivity);
    });

    // Initialize timeout
    resetTimeout();

    // Cleanup
    return () => {
      activityEvents.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    };
  }, [isAuthenticated, dispatch, navigate, timeoutMs, warningMs]);

  return {
    lastActivity: lastActivityRef.current,
    resetTimeout,
  };
};
