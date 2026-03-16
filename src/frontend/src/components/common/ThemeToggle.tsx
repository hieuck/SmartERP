/**
 * ThemeToggle Component
 * Button to toggle between light and dark theme
 */

import { Button, Tooltip } from 'antd';
import { MoonOutlined, SunOutlined } from '@ant-design/icons';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from 'react-i18next';

export interface ThemeToggleProps {
  /**
   * Button size
   */
  size?: 'small' | 'middle' | 'large';
  /**
   * Show text label
   */
  showLabel?: boolean;
  /**
   * Custom className
   */
  className?: string;
}

/**
 * Theme toggle button component
 * 
 * @param {ThemeToggleProps} props - Component props
 * @returns {JSX.Element} Theme toggle button
 * 
 * @example
 * ```tsx
 * // Icon only
 * <ThemeToggle />
 * 
 * // With label
 * <ThemeToggle showLabel />
 * 
 * // Large size
 * <ThemeToggle size="large" />
 * ```
 */
export function ThemeToggle({ 
  size = 'middle', 
  showLabel = false,
  className 
}: ThemeToggleProps) {
  const { isDark, toggleTheme } = useTheme();
  const { t } = useTranslation('common');

  const icon = isDark ? <SunOutlined /> : <MoonOutlined />;
  const label = isDark ? t('theme.light') : t('theme.dark');
  const tooltipTitle = isDark 
    ? t('theme.switchToLight') 
    : t('theme.switchToDark');

  return (
    <Tooltip title={!showLabel ? tooltipTitle : undefined}>
      <Button
        type="text"
        size={size}
        icon={icon}
        onClick={toggleTheme}
        className={className}
        aria-label={tooltipTitle}
      >
        {showLabel && label}
      </Button>
    </Tooltip>
  );
}

export default ThemeToggle;
