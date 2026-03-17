/**
 * ThemeToggle Component
 * Dropdown to select theme mode: light, dark, or auto
 */

import { BulbOutlined } from '@ant-design/icons';
import { Dropdown, MenuProps } from 'antd';
import { useThemeContext } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

export interface ThemeToggleProps {
  /**
   * Custom className
   */
  className?: string;
}

/**
 * Theme toggle dropdown component
 * Allows selection between light, dark, and auto modes
 * 
 * @param {ThemeToggleProps} props - Component props
 * @returns {JSX.Element} Theme toggle dropdown
 * 
 * @example
 * ```tsx
 * <ThemeToggle />
 * ```
 */
export function ThemeToggle({ className }: ThemeToggleProps) {
  const { themeMode, setThemeMode, theme } = useThemeContext();
  const { t } = useTranslation('common');

  const items: MenuProps['items'] = [
    {
      key: 'light',
      label: t('theme.light'),
      onClick: () => setThemeMode('light'),
    },
    {
      key: 'dark',
      label: t('theme.dark'),
      onClick: () => setThemeMode('dark'),
    },
    {
      key: 'auto',
      label: t('theme.auto'),
      onClick: () => setThemeMode('auto'),
    },
  ];

  return (
    <Dropdown menu={{ items, selectedKeys: [themeMode] }} placement="bottomRight">
      <div
        className={className}
        style={{
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: theme.token?.marginXS,
          padding: `${theme.token?.paddingXS}px ${theme.token?.paddingSM}px`,
          borderRadius: theme.token?.borderRadiusSM,
          transition: 'background-color 0.3s',
          color: theme.token?.colorText,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = theme.token?.colorBgTextHover || 'rgba(0, 0, 0, 0.04)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <BulbOutlined style={{ fontSize: theme.token?.fontSize }} />
      </div>
    </Dropdown>
  );
}

export default ThemeToggle;
