import { GlobalOutlined } from '@ant-design/icons';
import { Dropdown, MenuProps } from 'antd';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/hooks/useTheme';

const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation('common');
  const { theme } = useTheme();

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  const items: MenuProps['items'] = [
    {
      key: 'en',
      label: t('language.en'),
      onClick: () => changeLanguage('en'),
    },
    {
      key: 'vi',
      label: t('language.vi'),
      onClick: () => changeLanguage('vi'),
    },
  ];

  return (
    <Dropdown menu={{ items, selectedKeys: [i18n.language] }} placement="bottomRight">
      <div
        style={{
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: theme.token?.marginXS,
          padding: `${theme.token?.paddingXS}px ${theme.token?.paddingSM}px`,
          borderRadius: theme.token?.borderRadiusSM,
          transition: 'background-color 0.3s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = theme.token?.colorBgTextHover || 'rgba(0, 0, 0, 0.04)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <GlobalOutlined style={{ fontSize: theme.token?.fontSize }} />
        <span>{i18n.language === 'vi' ? 'VI' : 'EN'}</span>
      </div>
    </Dropdown>
  );
};

export default LanguageSwitcher;
