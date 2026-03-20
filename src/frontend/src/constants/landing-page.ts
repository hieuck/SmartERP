/**
 * Landing Page Constants
 *
 * Shared non-localized configuration for the landing page component.
 */

/**
 * Contact information
 */
export const CONTACT_INFO = {
  phone: '1900-xxxx',
  email: 'contact@smarterp.vn',
  address: 'Hà Nội, Việt Nam',
};

/**
 * Layout constants
 */
export const LAYOUT_CONSTANTS = {
  SECTION_PADDING: '80px 24px',
  MAX_WIDTH: 1200,
  GRID_GUTTER: [32, 32] as [number, number],
  HEADER_HEIGHT: 64,
  FOOTER_PADDING: '40px 24px 24px',
};

/**
 * Color constants
 */
export const COLORS = {
  PRIMARY: '#1890ff',
  DARK_BG: '#001529',
  LIGHT_BG: '#f5f5f5',
  WHITE: '#fff',
  TEXT_SECONDARY: 'rgba(255,255,255,0.65)',
  BORDER_LIGHT: 'rgba(255,255,255,0.1)',
  STAR_COLOR: '#fadb14',
};

/**
 * GA Configuration
 */
export const GA_CONFIG = {
  MEASUREMENT_ID: import.meta.env.VITE_GA_MEASUREMENT_ID || 'G-XXXXXXXXXX',
  PLACEHOLDER_ID: 'G-XXXXXXXXXX',
};
