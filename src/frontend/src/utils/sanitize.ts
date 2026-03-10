import DOMPurify from 'dompurify';

/**
 * Sanitize email input
 * - Trim whitespace
 * - Convert to lowercase
 * - Remove any HTML/script tags
 */
export const sanitizeEmail = (email: string): string => {
  if (!email) return '';
  return DOMPurify.sanitize(email.trim().toLowerCase(), { ALLOWED_TAGS: [] });
};

/**
 * Sanitize text input (general purpose)
 * - Remove HTML/script tags
 * - Preserve text content
 */
export const sanitizeText = (text: string): string => {
  if (!text) return '';
  return DOMPurify.sanitize(text, { ALLOWED_TAGS: [] });
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * Returns score 0-5:
 * 0: Too weak
 * 1: Weak
 * 2: Fair
 * 3: Good
 * 4: Strong
 * 5: Very Strong
 */
export const getPasswordStrength = (password: string): number => {
  if (!password) return 0;

  let strength = 0;

  // Length checks
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;

  // Character variety checks
  if (/[a-z]/.test(password)) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^a-zA-Z0-9]/.test(password)) strength++;

  return Math.min(strength, 5);
};

/**
 * Get password strength label
 */
export const getPasswordStrengthLabel = (strength: number): string => {
  const labels = ['Rất yếu', 'Yếu', 'Trung bình', 'Tốt', 'Mạnh', 'Rất mạnh'];
  return labels[Math.min(strength, 5)] || 'Rất yếu';
};

/**
 * Get password strength color
 */
export const getPasswordStrengthColor = (strength: number): string => {
  const colors = ['#ff4d4f', '#ff7a45', '#faad14', '#fadb14', '#52c41a', '#13c2c2'];
  return colors[Math.min(strength, 5)] || '#ff4d4f';
};
