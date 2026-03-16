import { ThemeConfig } from 'antd';

/**
 * Design Tokens
 * Centralized design system tokens for consistent UI
 */

/**
 * Spacing Scale (4px base unit)
 */
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

/**
 * Font Sizes
 */
export const FONT_SIZES = {
  xs: 11,
  sm: 12,
  base: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 30,
  xxxxl: 38,
} as const;

/**
 * Border Radius
 */
export const BORDER_RADIUS = {
  xs: 2,
  sm: 4,
  base: 6,
  lg: 8,
  xl: 12,
  xxl: 16,
  round: 9999,
} as const;

/**
 * Shadows
 */
export const SHADOWS = {
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02)',
  base: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
} as const;

/**
 * Z-Index Scale
 */
export const Z_INDEX = {
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
} as const;

/**
 * Transitions
 */
export const TRANSITIONS = {
  fast: '150ms',
  base: '200ms',
  slow: '300ms',
  slower: '500ms',
} as const;

/**
 * Animation Easings
 */
export const EASINGS = {
  linear: 'linear',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
} as const;

/**
 * Responsive Breakpoints
 */
export const BREAKPOINTS = {
  xs: 480,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  xxl: 1600,
} as const;

/**
 * Responsive Spacing Helper
 */
export const getResponsiveSpacing = (
  mobile: number,
  tablet: number,
  desktop: number,
): { mobile: number; tablet: number; desktop: number } => ({
  mobile,
  tablet,
  desktop,
});

/**
 * Common spacing patterns
 */
export const SPACING_PATTERNS = {
  pagePadding: getResponsiveSpacing(12, 16, 24),
  cardPadding: getResponsiveSpacing(12, 16, 24),
  sectionSpacing: getResponsiveSpacing(16, 24, 32),
  gutter: getResponsiveSpacing(8, 12, 16),
} as const;

/**
 * Responsive Font Size Helper
 */
export const getResponsiveFontSize = (
  mobile: number,
  tablet: number,
  desktop: number,
): { mobile: number; tablet: number; desktop: number } => ({
  mobile,
  tablet,
  desktop,
});

/**
 * Typography patterns
 */
export const TYPOGRAPHY = {
  h1: getResponsiveFontSize(24, 30, 38),
  h2: getResponsiveFontSize(20, 24, 30),
  h3: getResponsiveFontSize(18, 20, 24),
  h4: getResponsiveFontSize(16, 18, 20),
  h5: getResponsiveFontSize(14, 16, 16),
  body: getResponsiveFontSize(14, 14, 14),
  small: getResponsiveFontSize(12, 12, 12),
  tiny: getResponsiveFontSize(11, 11, 11),
} as const;

/**
 * Ant Design Theme Configuration
 * Following enterprise-grade design system standards
 *
 * Design System Specifications:
 * - Color Palette: Primary (#1890ff), Success (#52c41a), Warning (#faad14), Error (#ff4d4f)
 * - Typography: Inter font family, 14px base size
 * - Spacing: 4px base unit (4, 8, 16, 24, 32, 48, 64)
 * - Responsive breakpoints: xs (480px), sm (576px), md (768px), lg (992px), xl (1200px), xxl (1600px)
 * - Dark mode: Supported
 * - Accessibility: WCAG 2.1 AA compliant
 */
export const theme: ThemeConfig = {
  token: {
    // Color Palette
    colorPrimary: '#1890ff',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    colorInfo: '#1890ff',

    // Text Colors
    colorTextBase: '#000000',
    colorText: 'rgba(0, 0, 0, 0.88)',
    colorTextSecondary: 'rgba(0, 0, 0, 0.65)',
    colorTextTertiary: 'rgba(0, 0, 0, 0.45)',
    colorTextQuaternary: 'rgba(0, 0, 0, 0.25)',

    // Background Colors
    colorBgBase: '#ffffff',
    colorBgContainer: '#ffffff',
    colorBgElevated: '#ffffff',
    colorBgLayout: '#f0f2f5',

    // Border
    colorBorder: '#d9d9d9',
    colorBorderSecondary: '#f0f0f0',

    // Typography
    fontFamily:
      'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: 14,
    fontSizeHeading1: 38,
    fontSizeHeading2: 30,
    fontSizeHeading3: 24,
    fontSizeHeading4: 20,
    fontSizeHeading5: 16,
    lineHeight: 1.5715,
    lineHeightHeading1: 1.21,
    lineHeightHeading2: 1.27,
    lineHeightHeading3: 1.33,
    lineHeightHeading4: 1.4,
    lineHeightHeading5: 1.5,

    // Spacing (4px base unit)
    marginXS: 8,
    marginSM: 12,
    margin: 16,
    marginMD: 20,
    marginLG: 24,
    marginXL: 32,
    marginXXL: 48,

    paddingXS: 8,
    paddingSM: 12,
    padding: 16,
    paddingMD: 20,
    paddingLG: 24,
    paddingXL: 32,

    // Border Radius
    borderRadius: 6,
    borderRadiusLG: 8,
    borderRadiusSM: 4,
    borderRadiusXS: 2,

    // Control Heights
    controlHeight: 32,
    controlHeightLG: 40,
    controlHeightSM: 24,

    // Z-Index
    zIndexBase: 0,
    zIndexPopupBase: 1000,
  },

  components: {
    // Button Component
    Button: {
      controlHeight: 32,
      controlHeightLG: 40,
      controlHeightSM: 24,
      borderRadius: 6,
      fontWeight: 400,
      primaryShadow: '0 2px 0 rgba(5, 145, 255, 0.1)',
    },

    // Input Component
    Input: {
      controlHeight: 32,
      controlHeightLG: 40,
      controlHeightSM: 24,
      borderRadius: 6,
      paddingBlock: 4,
      paddingInline: 11,
    },

    // Select Component
    Select: {
      controlHeight: 32,
      controlHeightLG: 40,
      controlHeightSM: 24,
      borderRadius: 6,
    },

    // Table Component
    Table: {
      borderRadius: 6,
      headerBg: '#fafafa',
      headerColor: 'rgba(0, 0, 0, 0.88)',
      headerSortActiveBg: '#f0f0f0',
      headerSortHoverBg: '#f5f5f5',
      bodySortBg: '#fafafa',
      rowHoverBg: '#fafafa',
      cellPaddingBlock: 12,
      cellPaddingInline: 16,
    },

    // Card Component
    Card: {
      borderRadius: 8,
      boxShadow:
        '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)',
      headerHeight: 56,
      headerFontSize: 16,
      headerFontSizeSM: 14,
    },

    // Modal Component
    Modal: {
      borderRadius: 8,
      headerBg: '#ffffff',
      contentBg: '#ffffff',
      footerBg: '#ffffff',
    },

    // Drawer Component
    Drawer: {
      footerPaddingBlock: 16,
      footerPaddingInline: 24,
    },

    // Form Component
    Form: {
      labelFontSize: 14,
      labelColor: 'rgba(0, 0, 0, 0.88)',
      labelHeight: 32,
      verticalLabelPadding: '0 0 8px',
      itemMarginBottom: 24,
    },

    // Menu Component
    Menu: {
      itemBorderRadius: 6,
      itemHeight: 40,
      itemPaddingInline: 16,
      iconSize: 16,
      iconMarginInlineEnd: 10,
      collapsedIconSize: 16,
      collapsedWidth: 80,
    },

    // Layout Component
    Layout: {
      headerBg: '#001529',
      headerHeight: 64,
      headerPadding: '0 24px',
      headerColor: 'rgba(255, 255, 255, 0.85)',
      siderBg: '#ffffff',
      bodyBg: '#f0f2f5',
      footerBg: '#f0f2f5',
      footerPadding: '24px 50px',
      triggerBg: '#002140',
      triggerColor: '#ffffff',
      triggerHeight: 48,
    },

    // Breadcrumb Component
    Breadcrumb: {
      fontSize: 14,
      iconFontSize: 14,
      linkColor: 'rgba(0, 0, 0, 0.45)',
      linkHoverColor: 'rgba(0, 0, 0, 0.88)',
      itemColor: 'rgba(0, 0, 0, 0.45)',
      lastItemColor: 'rgba(0, 0, 0, 0.88)',
      separatorColor: 'rgba(0, 0, 0, 0.45)',
      separatorMargin: 8,
    },

    // Pagination Component
    Pagination: {
      itemSize: 32,
      itemSizeSM: 24,
      itemActiveBg: '#1890ff',
      itemLinkBg: '#ffffff',
      itemBg: '#ffffff',
      itemInputBg: '#ffffff',
    },

    // Tag Component
    Tag: {
      defaultBg: '#fafafa',
      defaultColor: 'rgba(0, 0, 0, 0.88)',
    },

    // Badge Component
    Badge: {
      dotSize: 6,
      textFontSize: 12,
      textFontSizeSM: 12,
      textFontWeight: 'normal',
      statusSize: 6,
    },

    // Notification Component
    Notification: {
      width: 384,
      zIndexPopup: 1010,
    },

    // Message Component
    Message: {
      contentBg: '#ffffff',
      contentPadding: '10px 16px',
      zIndexPopup: 1010,
    },

    // Tooltip Component
    Tooltip: {
      borderRadius: 6,
      colorBgSpotlight: 'rgba(0, 0, 0, 0.85)',
      colorTextLightSolid: '#ffffff',
    },

    // Popover Component
    Popover: {
      minWidth: 177,
      zIndexPopup: 1030,
    },

    // Dropdown Component
    Dropdown: {
      paddingBlock: 4,
      controlPaddingHorizontal: 12,
      zIndexPopup: 1050,
    },

    // DatePicker Component
    DatePicker: {
      controlHeight: 32,
      controlHeightLG: 40,
      controlHeightSM: 24,
      borderRadius: 6,
    },

    // Upload Component
    Upload: {
      actionsColor: 'rgba(0, 0, 0, 0.45)',
    },

    // Steps Component
    Steps: {
      iconSize: 32,
      iconSizeSM: 24,
      dotSize: 8,
      dotCurrentSize: 10,
      titleLineHeight: 32,
      customIconSize: 32,
      customIconTop: 0,
      customIconFontSize: 24,
      iconTop: -0.5,
      iconFontSize: 16,
    },

    // Progress Component
    Progress: {
      defaultColor: '#1890ff',
      remainingColor: 'rgba(0, 0, 0, 0.06)',
      circleTextColor: 'rgba(0, 0, 0, 0.88)',
      lineBorderRadius: 100,
    },

    // Spin Component
    Spin: {
      contentHeight: 400,
      dotSize: 20,
      dotSizeSM: 14,
      dotSizeLG: 32,
    },

    // Alert Component
    Alert: {
      withDescriptionIconSize: 24,
      withDescriptionPadding: '15px 15px 15px 64px',
    },

    // Skeleton Component
    Skeleton: {
      borderRadius: 6,
      titleHeight: 16,
      blockRadius: 6,
      paragraphMarginTop: 28,
      paragraphLiHeight: 16,
    },

    // Tabs Component
    Tabs: {
      cardBg: '#fafafa',
      cardHeight: 40,
      cardPadding: '8px 16px',
      cardPaddingSM: '6px 12px',
      cardPaddingLG: '10px 20px',
      titleFontSize: 14,
      titleFontSizeLG: 16,
      titleFontSizeSM: 14,
      inkBarColor: '#1890ff',
      horizontalMargin: '0 0 16px 0',
      horizontalItemGutter: 32,
      horizontalItemMargin: '0 0 0 0',
      horizontalItemMarginRTL: '0 0 0 0',
      horizontalItemPadding: '12px 0',
      horizontalItemPaddingSM: '8px 0',
      horizontalItemPaddingLG: '16px 0',
      verticalItemPadding: '8px 24px',
      verticalItemMargin: '0 0 16px 0',
    },
  },
};

/**
 * Dark Theme Configuration
 * For dark mode support
 */
export const darkTheme: ThemeConfig = {
  ...theme,
  token: {
    ...theme.token,
    // Dark mode color overrides
    colorTextBase: '#ffffff',
    colorText: 'rgba(255, 255, 255, 0.85)',
    colorTextSecondary: 'rgba(255, 255, 255, 0.65)',
    colorTextTertiary: 'rgba(255, 255, 255, 0.45)',
    colorTextQuaternary: 'rgba(255, 255, 255, 0.25)',

    colorBgBase: '#141414',
    colorBgContainer: '#1f1f1f',
    colorBgElevated: '#262626',
    colorBgLayout: '#000000',

    colorBorder: '#434343',
    colorBorderSecondary: '#303030',
  },
};

export default theme;
