import {
  sanitizeEmail,
  sanitizeText,
  isValidEmail,
  getPasswordStrength,
  getPasswordStrengthLabel,
  getPasswordStrengthColor,
} from './sanitize';

const nullableString = (value: string | null | undefined) => value ?? '';

describe('sanitize utils', () => {
  describe('sanitizeEmail', () => {
    it('should trim and lowercase email', () => {
      expect(sanitizeEmail('  TEST@EXAMPLE.COM  ')).toBe('test@example.com');
    });

    it('should remove HTML tags from email', () => {
      expect(sanitizeEmail('<script>alert("xss")</script>test@example.com')).toBe('test@example.com');
    });

    it('should handle empty email', () => {
      expect(sanitizeEmail('')).toBe('');
    });

    it('should handle null/undefined email', () => {
      expect(sanitizeEmail(nullableString(null))).toBe('');
      expect(sanitizeEmail(nullableString(undefined))).toBe('');
    });

    it('should remove script tags', () => {
      expect(sanitizeEmail('test@example.com<script>alert(1)</script>')).toBe('test@example.com');
    });
  });

  describe('sanitizeText', () => {
    it('should remove HTML tags', () => {
      expect(sanitizeText('<p>Hello World</p>')).toBe('Hello World');
    });

    it('should remove script tags', () => {
      expect(sanitizeText('<script>alert("xss")</script>Safe text')).toBe('Safe text');
    });

    it('should preserve text content', () => {
      expect(sanitizeText('Plain text')).toBe('Plain text');
    });

    it('should handle empty text', () => {
      expect(sanitizeText('')).toBe('');
    });

    it('should handle null/undefined text', () => {
      expect(sanitizeText(nullableString(null))).toBe('');
      expect(sanitizeText(nullableString(undefined))).toBe('');
    });

    it('should remove multiple HTML tags', () => {
      expect(sanitizeText('<div><span>Text</span></div>')).toBe('Text');
    });
  });

  describe('isValidEmail', () => {
    it('should validate correct email format', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@example.co.uk')).toBe(true);
      expect(isValidEmail('user+tag@example.com')).toBe(true);
    });

    it('should reject invalid email format', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('invalid@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('invalid@example')).toBe(false);
      expect(isValidEmail('invalid @example.com')).toBe(false);
    });

    it('should reject empty email', () => {
      expect(isValidEmail('')).toBe(false);
    });
  });

  describe('getPasswordStrength', () => {
    it('should return 0 for empty password', () => {
      expect(getPasswordStrength('')).toBe(0);
    });

    it('should return 2 for password with only length and numbers', () => {
      // '12345678' has: length>=8 (1 point) + numbers (1 point) = 2 points
      expect(getPasswordStrength('12345678')).toBe(2);
    });

    it('should return 2 for fair password (length + lowercase)', () => {
      expect(getPasswordStrength('abcdefgh')).toBe(2);
    });

    it('should return 3 for good password (length + lowercase + uppercase)', () => {
      expect(getPasswordStrength('Abcdefgh')).toBe(3);
    });

    it('should return 4 for strong password (length + lowercase + uppercase + number)', () => {
      expect(getPasswordStrength('Abcdefgh1')).toBe(4);
    });

    it('should return 5 for very strong password (all criteria)', () => {
      expect(getPasswordStrength('Abcdefgh1!')).toBe(5);
    });

    it('should cap strength at 5', () => {
      expect(getPasswordStrength('VeryLongPassword123!@#$%')).toBe(5);
    });

    it('should give bonus for length >= 12', () => {
      expect(getPasswordStrength('abcdefghijkl')).toBe(3); // length(2) + lowercase(1)
    });
  });

  describe('getPasswordStrengthLabel', () => {
    it('should return correct labels', () => {
      expect(getPasswordStrengthLabel(0)).toBe('Rất yếu');
      expect(getPasswordStrengthLabel(1)).toBe('Yếu');
      expect(getPasswordStrengthLabel(2)).toBe('Trung bình');
      expect(getPasswordStrengthLabel(3)).toBe('Tốt');
      expect(getPasswordStrengthLabel(4)).toBe('Mạnh');
      expect(getPasswordStrengthLabel(5)).toBe('Rất mạnh');
    });

    it('should handle out of range values', () => {
      expect(getPasswordStrengthLabel(-1)).toBe('Rất yếu');
      expect(getPasswordStrengthLabel(10)).toBe('Rất mạnh');
    });
  });

  describe('getPasswordStrengthColor', () => {
    it('should return correct colors', () => {
      expect(getPasswordStrengthColor(0)).toBe('#ff4d4f');
      expect(getPasswordStrengthColor(1)).toBe('#ff7a45');
      expect(getPasswordStrengthColor(2)).toBe('#faad14');
      expect(getPasswordStrengthColor(3)).toBe('#fadb14');
      expect(getPasswordStrengthColor(4)).toBe('#52c41a');
      expect(getPasswordStrengthColor(5)).toBe('#13c2c2');
    });

    it('should handle out of range values', () => {
      expect(getPasswordStrengthColor(-1)).toBe('#ff4d4f');
      expect(getPasswordStrengthColor(10)).toBe('#13c2c2');
    });
  });
});
