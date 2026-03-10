import { useState, useCallback, useEffect } from 'react';

interface RateLimitConfig {
  maxAttempts?: number;
  windowMs?: number; // Time window in milliseconds
}

interface RateLimitState {
  attempts: number;
  isLimited: boolean;
  remainingTime: number;
  resetTime: number | null;
}

/**
 * Hook for client-side rate limiting
 * Default: 5 attempts per 60 seconds
 * 
 * Usage:
 * const { isLimited, attempts, remainingTime, recordAttempt } = useRateLimit();
 * 
 * if (isLimited) {
 *   return <div>Too many attempts. Try again in {remainingTime}s</div>;
 * }
 * 
 * const handleSubmit = () => {
 *   recordAttempt();
 *   // ... submit logic
 * };
 */
export const useRateLimit = (config: RateLimitConfig = {}) => {
  const maxAttempts = config.maxAttempts || 5;
  const windowMs = config.windowMs || 60 * 1000; // 60 seconds

  const [state, setState] = useState<RateLimitState>({
    attempts: 0,
    isLimited: false,
    remainingTime: 0,
    resetTime: null,
  });

  // Update remaining time every second
  useEffect(() => {
    if (!state.resetTime) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((state.resetTime - now) / 1000));

      if (remaining === 0) {
        // Reset rate limit
        setState({
          attempts: 0,
          isLimited: false,
          remainingTime: 0,
          resetTime: null,
        });
        clearInterval(interval);
      } else {
        setState((prev) => ({
          ...prev,
          remainingTime: remaining,
          isLimited: prev.attempts >= maxAttempts,
        }));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [state.resetTime, maxAttempts]);

  const recordAttempt = useCallback(() => {
    setState((prev) => {
      const now = Date.now();
      const newAttempts = prev.attempts + 1;
      const newResetTime = prev.resetTime || now + windowMs;
      const isLimited = newAttempts >= maxAttempts;

      return {
        attempts: newAttempts,
        isLimited,
        remainingTime: Math.ceil((newResetTime - now) / 1000),
        resetTime: newResetTime,
      };
    });
  }, [maxAttempts, windowMs]);

  const reset = useCallback(() => {
    setState({
      attempts: 0,
      isLimited: false,
      remainingTime: 0,
      resetTime: null,
    });
  }, []);

  return {
    ...state,
    recordAttempt,
    reset,
  };
};
