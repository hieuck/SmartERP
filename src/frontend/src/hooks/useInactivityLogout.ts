import { useSessionTimeout } from './useSessionTimeout';

/**
 * @deprecated Prefer useSessionTimeout for authenticated session expiry handling.
 */
export const useInactivityLogout = () => {
  useSessionTimeout();
};
