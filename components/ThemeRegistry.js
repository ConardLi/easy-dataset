'use client';

import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider as NextThemeProvider, useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

// 导入字体
import '@fontsource/inter/300.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';

// 创建主题配置
const getTheme = mode => {
  // 主色调
  const mainBlue = '#2A5CAA';
  const darkGray = '#2D2D2D';

  // 辅助色 - 数据可视化色谱
  const dataVizColors = [
    '#6366F1', // 紫蓝色
    '#10B981', // 绿色
    '#F59E0B', // 琥珀色
    '#EC4899', // 粉色
    '#8B5CF6', // 紫色
    '#3B82F6' // 蓝色
  ];

  // 状态色
  const successColor = '#10B981'; // 翡翠绿
  const warningColor = '#F59E0B'; // 琥珀色
  const errorColor = '#EF4444'; // 珊瑚红

  // 渐变色
  const gradientPrimary = 'linear-gradient(90deg, #2A5CAA 0%, #8B5CF6 100%)';

  // 根据模式调整颜色
  return createTheme({
    palette: {
      mode,
      primary: {
        main: mainBlue,
        dark: '#1E4785',
        light: '#4878C6',
        contrastText: '#FFFFFF'
      },
      secondary: {
        main: '#8B5CF6',
        dark: '#7039F2',
        light: '#A78BFA',
        contrastText: '#FFFFFF'
      },
      error: {
        main: errorColor,
        dark: '#DC2626',
        light: '#F87171'
      },
      warning: {
        main: warningColor,
        dark: '#D97706',
        light: '#FBBF24'
      },
      success: {
        main: successColor,
        dark: '#059669',
        light: '#34D399'
      },
      background: {
        default: mode === 'dark' ? '#121212' : '#F8F9FA',
        paper: mode === 'dark' ? '#1E1E1E' : '#FFFFFF',
        subtle: mode === 'dark' ? '#2A2A2A' : '#F3F4F6'
      },
      text: {
        primary: mode === 'dark' ? '#F3F4F6' : darkGray,
        secondary: mode === 'dark' ? '#9CA3AF' : '#6B7280',
        disabled: mode === 'dark' ? '#4B5563' : '#9CA3AF'
      },
      divider: mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
      dataViz: dataVizColors,
      gradient: {
        primary: gradientPrimary
      }
    },
    typography: {
      fontFamily:
        '"Inter", "HarmonyOS Sans", "PingFang SC", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      fontSize: 14,
      fontWeightLight: 300,
      fontWeightRegular: 400,
      fontWeightMedium: 500,
      fontWeightBold: 600,
      h1: {
        fontSize: '2rem', // 32px
        fontWeight: 600,
        lineHeight: 1.2,
        letterSpacing: '-0.01em'
      },
      h2: {
        fontSize: '1.5rem', // 24px
        fontWeight: 600,
        lineHeight: 1.3,
        letterSpacing: '-0.005em'
      },
      h3: {
        fontSize: '1.25rem', // 20px
        fontWeight: 600,
        lineHeight: 1.4
      },
      h4: {
        fontSize: '1.125rem', // 18px
        fontWeight: 600,
        lineHeight: 1.4
      },
      h5: {
        fontSize: '1rem', // 16px
        fontWeight: 600,
        lineHeight: 1.5
      },
      h6: {
        fontSize: '0.875rem', // 14px
        fontWeight: 600,
        lineHeight: 1.5
      },
      body1: {
        fontSize: '1rem', // 16px
        lineHeight: 1.5
      },
      body2: {
        fontSize: '0.875rem', // 14px
        lineHeight: 1.5
      },
      caption: {
        fontSize: '0.75rem', // 12px
        lineHeight: 1.5
      },
      code: {
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: '0.875rem'
      }
    },
    shape: {
      borderRadius: 8
    },
    spacing: 8, // 基础间距单位为8px
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            scrollbarWidth: 'thin',
            scrollbarColor: mode === 'dark' ? '#4B5563 transparent' : '#9CA3AF transparent',
            '&::-webkit-scrollbar': {
              width: '8px',
              height: '8px'
            },
            '&::-webkit-scrollbar-track': {
              background: 'transparent'
            },
            '&::-webkit-scrollbar-thumb': {
              background: mode === 'dark' ? '#4B5563' : '#9CA3AF',
              borderRadius: '4px'
            }
          },
          // 确保代码块使用 JetBrains Mono 字体
          'code, pre': {
            fontFamily: '"JetBrains Mono", monospace'
          },
          // 自定义渐变文本的通用样式
          '.gradient-text': {
            background: gradientPrimary,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textFillColor: 'transparent'
          }
        }
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 500,
            borderRadius: '8px',
            padding: '6px 16px'
          },
          contained: {
            boxShadow: 'none',
            '&:hover': {
              boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)'
            }
          },
          containedPrimary: {
            background: mainBlue,
            '&:hover': {
              backgroundColor: '#1E4785'
            }
          },
          containedSecondary: {
            background: '#8B5CF6',
            '&:hover': {
              backgroundColor: '#7039F2'
            }
          },
          outlined: {
            borderWidth: '1.5px',
            '&:hover': {
              borderWidth: '1.5px'
            }
          }
        }
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: 'none',
            background: mode === 'dark' ? '#1A1A1A' : mainBlue
          }
        }
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: '12px',
            boxShadow: mode === 'dark' ? '0px 4px 8px rgba(0, 0, 0, 0.4)' : '0px 4px 8px rgba(0, 0, 0, 0.05)'
          }
        }
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: '12px'
          }
        }
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: '6px',
            fontWeight: 500
          }
        }
      },
      MuiTableHead: {
        styleOverrides: {
          root: {
            '& .MuiTableCell-head': {
              fontWeight: 600,
              backgroundColor: mode === 'dark' ? '#2A2A2A' : '#F3F4F6'
            }
          }
        }
      },
      MuiTabs: {
        styleOverrides: {
          indicator: {
            height: '3px',
            borderRadius: '3px 3px 0 0'
          }
        }
      },
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 500,
            '&.Mui-selected': {
              fontWeight: 600
            }
          }
        }
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: '8px'
          }
        }
      },
      MuiDialogTitle: {
        styleOverrides: {
          root: {
            fontSize: '1.25rem',
            fontWeight: 600
          }
        }
      }
    }
  });
};

export default function ThemeRegistry({ children }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <NextThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <InnerThemeRegistry>{children}</InnerThemeRegistry>
    </NextThemeProvider>
  );
}

function InnerThemeRegistry({ children }) {
  const { resolvedTheme } = useTheme();
  const theme = getTheme(resolvedTheme === 'dark' ? 'dark' : 'light');

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
