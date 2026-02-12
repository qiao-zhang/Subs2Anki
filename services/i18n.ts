import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// 导入语言资源文件
import enTranslation from '../locales/en.json';
import zhTranslation from '../locales/zh.json';

// 检测用户的语言偏好
const detectedLanguage = (): string => {
  const savedLang = localStorage.getItem('language');
  if (savedLang && ['en', 'zh'].includes(savedLang)) {
    return savedLang;
  }
  
  // 尝试从浏览器获取语言偏好
  const browserLang = navigator.language.split('-')[0]; // 获取语言部分，例如 'zh' 或 'en'
  if (['en', 'zh'].includes(browserLang)) {
    return browserLang;
  }
  
  // 默认返回英语
  return 'en';
};

const resources = {
  en: {
    translation: enTranslation
  },
  zh: {
    translation: zhTranslation
  }
};

i18n
  .use(initReactI18next) // 将react-i18next传递给i18next
  .init({
    resources,
    lng: detectedLanguage(), // 设置默认语言
    fallbackLng: 'en', // 回退语言
    interpolation: {
      escapeValue: false // react已经安全地处理了XSS
    }
  });

export default i18n;