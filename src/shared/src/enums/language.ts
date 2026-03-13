// Language enums for i18n support

export enum Language {
  // Vietnamese
  VI = 'vi',
  
  // English
  EN = 'en',
  
  // Japanese
  JA = 'ja',
  
  // Korean
  KO = 'ko',
  
  // Chinese (Simplified)
  ZH_CN = 'zh-CN',
  
  // Chinese (Traditional)
  ZH_TW = 'zh-TW',
  
  // Thai
  TH = 'th',
  
  // Indonesian
  ID = 'id',
  
  // French
  FR = 'fr',
  
  // German
  DE = 'de',
  
  // Spanish
  ES = 'es',
  
  // Portuguese
  PT = 'pt',
}

export const LanguageName: Record<Language, string> = {
  [Language.VI]: 'Tiếng Việt',
  [Language.EN]: 'English',
  [Language.JA]: '日本語',
  [Language.KO]: '한국어',
  [Language.ZH_CN]: '简体中文',
  [Language.ZH_TW]: '繁體中文',
  [Language.TH]: 'ไทย',
  [Language.ID]: 'Bahasa Indonesia',
  [Language.FR]: 'Français',
  [Language.DE]: 'Deutsch',
  [Language.ES]: 'Español',
  [Language.PT]: 'Português',
};

export const LanguageNativeName: Record<Language, string> = {
  [Language.VI]: 'Tiếng Việt',
  [Language.EN]: 'English',
  [Language.JA]: '日本語',
  [Language.KO]: '한국어',
  [Language.ZH_CN]: '简体中文',
  [Language.ZH_TW]: '繁體中文',
  [Language.TH]: 'ไทย',
  [Language.ID]: 'Bahasa Indonesia',
  [Language.FR]: 'Français',
  [Language.DE]: 'Deutsch',
  [Language.ES]: 'Español',
  [Language.PT]: 'Português',
};
