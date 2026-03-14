import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { logout } from '@/store/slices/authSlice';
import { message } from 'antd';

/**
 * Hook to automatically logout user after 30 minutes of inactivity
 * Requirement 23.3: Auto-logout after 30 minutes inactivity
 */
export const useInactivityLogout = () => {
  const dispatch = useDispatch();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds

  const resetTimer = () => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      message.warning('You have been logged out due to inactivity');
      dispatch(logout());
      window.location.href = '/login';
    }, INACTIVITY_TIMEOUT);
  };

  useEffect(() => {
    // Events that indicate user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

    // Reset timer on any user activity
    const handleActivity = () => {
      resetTimer();
    };

    // Add event listeners
    events.forEach((event) => {
      document.addEventListener(event, handleActivity);
    });

    // Initialize timer
    resetTimer();

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [dispatch]);
};
