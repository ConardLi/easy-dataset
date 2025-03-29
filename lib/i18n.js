import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// 导入翻译文件
import enTranslation from '../locales/en/translation.json';
import zhCNTranslation from '../locales/zh-CN/translation.json';

// 避免在服务器端重复初始化
const isServer = typeof window === 'undefined';
const i18nInstance = i18n.createInstance();

// 仅在客户端初始化 i18next
if (!isServer && !i18n.isInitialized) {
  i18nInstance
    // 检测用户语言
    .use(LanguageDetector)
    // 将 i18n 实例传递给 react-i18next
    .use(initReactI18next)
    // 初始化
    .init({
      resources: {
        en: {
          translation: enTranslation
        },
        'zh-CN': {
          translation: zhCNTranslation
        }
      },
      fallbackLng: 'en',
      debug: process.env.NODE_ENV === 'development',

      interpolation: {
        escapeValue: false // 不转义 HTML
      },

      // 检测用户语言的选项
      detection: {
        order: ['localStorage', 'navigator'],
        lookupLocalStorage: 'i18nextLng',
        caches: ['localStorage']
      }
    });
}

export default i18nInstance;
