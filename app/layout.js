import './globals.css';
import ThemeRegistry from '@/components/ThemeRegistry';
import I18nProvider from '@/components/I18nProvider';
import { Toaster } from 'sonner';
import { Provider } from 'jotai';
import { initializeDatabase } from '@/lib/db/init';

export const metadata = {
  title: 'HKGAI Dataset Generation',
  description: '一个强大的 LLM 数据集生成工具',
  icons: {
    icon: [
      { url: '/logo.svg', type: 'image/svg+xml' },
      { url: '/imgs/logo.ico' }
    ]
  }
};

// 在服务端初始化数据库
initializeDatabase().catch(error => {
  console.error('应用启动时初始化数据库失败:', error);
});

export default function RootLayout({ children }) {
  return (
    <html lang="zh" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Provider>
          <ThemeRegistry>
            <I18nProvider>
              <div className="page-shell">
                {children}
              </div>
              <Toaster richColors position="top-center" />
            </I18nProvider>
          </ThemeRegistry>
        </Provider>
      </body>
    </html>
  );
}
