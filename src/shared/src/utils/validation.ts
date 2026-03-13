/**
 * Validation Utilities
 * 
 * Common validation functions for email, phone, URL, etc.
 */

/**
 * Validate email address
 * 
 * @param email - Email address to validate
 * @returns True if valid email
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number
 * 
 * @param phone - Phone number to validate
 * @returns True if valid phone number
 */
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^\+?[\d\s\-()]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
};

/**
 * Validate URL
 * 
 * @param url - URL to validate
 * @returns True if valid URL
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validate UUID
 * 
 * @param uuid - UUID to validate
 * @returns True if valid UUID
 */
export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * Validate date string
 * 
 * @param date - Date string to validate
 * @returns True if valid date
 */
export const isValidDate = (date: string): boolean => {
  const d = new Date(date);
  return d instanceof Date && !isNaN(d.getTime());
};

/**
 * Validate number range
 * 
 * @param value - Value to validate
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns True if value is within range
 */
export const isInRange = (value: number, min: number, max: number): boolean => {
  return value >= min && value <= max;
};

/**
 * Validate string length
 * 
 * @param text - Text to validate
 * @param minLength - Minimum length
 * @param maxLength - Maximum length
 * @returns True if length is valid
 */
export const isValidLength = (text: string, minLength: number, maxLength: number): boolean => {
  return text.length >= minLength && text.length <= maxLength;
};

/**
 * Validate password strength
 * 
 * @param password - Password to validate
 * @returns Object with validation result and strength score
 */
export const validatePasswordStrength = (
  password: string,
): { isValid: boolean; score: number; feedback: string[] } => {
  const feedback: string[] = [];
  let score = 0;
  
  // Length check
  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('Password must be at least 8 characters long');
  }
  
  // Uppercase check
  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Password must contain at least one uppercase letter');
  }
  
  // Lowercase check
  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Password must contain at least one lowercase letter');
  }
  
  // Number check
  if (/\d/.test(password)) {
    score += 1;
  } else {
    feedback.push('Password must contain at least one number');
  }
  
  // Special character check
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Password must contain at least one special character');
  }
  
  return {
    isValid: score >= 4,
    score,
    feedback,
  };
};

/**
 * Sanitize string (remove HTML tags and special characters)
 * 
 * @param text - Text to sanitize
 * @returns Sanitized string
 */
export const sanitizeString = (text: string): string => {
  return text
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[^\w\s\-.,!?]/g, '') // Remove special characters except basic punctuation
    .trim();
};

/**
 * Validate JSON string
 * 
 * @param json - JSON string to validate
 * @returns True if valid JSON
 */
export const isValidJSON = (json: string): boolean => {
  try {
    JSON.parse(json);
    return true;
  } catch {
    return false;
  }
};
