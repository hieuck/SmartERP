import { GlobalOutlined } from '@ant-design/icons';
import { Dropdown, MenuProps } from 'antd';
import { useTranslation } from 'react-i18next';
import enUS from 'antd/locale/en_US';
import viVN from 'antd/locale/vi_VN';
import { ConfigProvider } from 'antd';
import { useEffect, useState } from 'react';

const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation('common');
  const [antdLocale, setAntdLocale] = useState(viVN);

  useEffect(() => {
    // Sync Ant Design locale with i18n language
    setAntdLocale(i18n.language === 'vi' ? viVN : enUS);
  }, [i18n.language]);

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    setAntdLocale(lang === 'vi' ? viVN : enUS);
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
          gap: '8px',
          padding: '8px 12px',
          borderRadius: '4px',
          transition: 'background-color 0.3s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.04)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <GlobalOutlined style={{ fontSize: '16px' }} />
        <span>{i18n.language === 'vi' ? 'VI' : 'EN'}</span>
      </div>
    </Dropdown>
  );
};

export default LanguageSwitcher;
