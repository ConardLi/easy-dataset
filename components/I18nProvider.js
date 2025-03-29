'use client';

import { useEffect } from 'react';
import i18n from '@/lib/i18n';
import { I18nextProvider } from 'react-i18next';

export default function I18nProvider({ children }) {
  useEffect(() => {
    // 确保i18n只在客户端初始化
    if (typeof window !== 'undefined') {
      // 这里可以添加任何客户端特定的i18n初始化逻辑
    }
  }, []);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
