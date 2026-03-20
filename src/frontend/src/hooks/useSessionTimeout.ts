import { useCallback, useEffect, useRef } from 'react';
import { authService } from '@/services/auth/authService';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { clearCredentials } from '@/store/slices/authSlice';
import { RootState } from '@/store';

interface UseSessionTimeoutConfig {
  timeoutMs?: number; // Default: 30 minutes
  warningMs?: number; // Show warning before timeout (default: 5 minutes before)
  enabled?: boolean;
  onWarning?: () => void;
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
  const enabled = config.enabled ?? true;
  const onWarning = config.onWarning;

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }
  }, []);

  const resetTimeout = useCallback(() => {
    clearTimers();

    lastActivityRef.current = Date.now();

    if (warningMs > 0 && warningMs < timeoutMs) {
      warningTimeoutRef.current = setTimeout(() => {
        onWarning?.();
      }, timeoutMs - warningMs);
    }

    timeoutRef.current = setTimeout(() => {
      void authService.logout().catch(() => undefined);
      dispatch(clearCredentials());
      navigate('/login', {
        replace: true,
        state: { reason: 'session-expired' },
      });
    }, timeoutMs);
  }, [clearTimers, dispatch, navigate, onWarning, timeoutMs, warningMs]);

  useEffect(() => {
    if (!enabled || !isAuthenticated) {
      clearTimers();
      return;
    }

    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

    const handleActivity = () => {
      resetTimeout();
    };

    activityEvents.forEach((event) => {
      document.addEventListener(event, handleActivity);
    });

    resetTimeout();

    return () => {
      activityEvents.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
      clearTimers();
    };
  }, [clearTimers, enabled, isAuthenticated, resetTimeout]);

  return {
    lastActivity: lastActivityRef.current,
    resetTimeout,
  };
};
