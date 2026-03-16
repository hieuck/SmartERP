/**
 * useLocale Hook
 * Hook for managing application locale (language switching)
 */

import { useTranslation } from 'react-i18next';
import { useCallback } from 'react';
import type { Locale } from 'antd/es/locale';
import viVN from 'antd/locale/vi_VN';
import enUS from 'antd/locale/en_US';

export type SupportedLanguage = 'en' | 'vi';

export interface UseLocaleReturn {
  currentLanguage: SupportedLanguage;
  antdLocale: Locale;
  changeLanguage: (lang: SupportedLanguage) => Promise<void>;
  t: (key: string, options?: any) => string;
}

/**
 * Hook for managing application locale
 * 
 * @returns {UseLocaleReturn} Locale management functions and state
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { currentLanguage, changeLanguage, t } = useLocale();
 *   
 *   return (
 *     <div>
 *       <p>{t('common:welcome')}</p>
 *       <Button onClick={() => changeLanguage('vi')}>Tiếng Việt</Button>
 *       <Button onClick={() => changeLanguage('en')}>English</Button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useLocale(): UseLocaleReturn {
  const { i18n, t } = useTranslation();
  
  const currentLanguage = (i18n.language || 'en') as SupportedLanguage;
  
  // Get Ant Design locale based on current language
  const antdLocale = currentLanguage === 'vi' ? viVN : enUS;
  
  // Change language function
  const changeLanguage = useCallback(async (lang: SupportedLanguage) => {
    await i18n.changeLanguage(lang);
    // Store in localStorage for persistence
    localStorage.setItem('language', lang);
  }, [i18n]);
  
  return {
    currentLanguage,
    antdLocale,
    changeLanguage,
    t,
  };
}

export default useLocale;
