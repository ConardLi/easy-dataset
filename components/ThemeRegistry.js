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
  // 科技风格配色方案
  const isDark = mode === 'dark';
  
  // 主色调 - 科技蓝紫渐变
  const primaryBlue = '#6366F1'; // Indigo-500
  const primaryPurple = '#8B5CF6'; // Violet-500
  const accentCyan = '#06B6D4'; // Cyan-500
  const neonBlue = '#3B82F6'; // Blue-500
  
  // 背景色 - 深色科技感
  const bgDark = '#0A0E27'; // 深蓝黑背景
  const bgDarkSecondary = '#0F172A'; // 稍亮的深色
  const bgLight = '#FAFBFC'; // 更柔和的浅色背景
  const bgLightSecondary = '#FFFFFF'; // 纯白
  
  // 文字颜色 - 高对比度确保可读性
  const textDarkPrimary = '#F1F5F9'; // 几乎白色，高对比度
  const textDarkSecondary = '#CBD5E1'; // 浅灰，清晰可读
  const textLightPrimary = '#1E293B'; // 更深的文字，确保高对比度
  const textLightSecondary = '#475569'; // 中灰，清晰可读
  
  // 辅助色 - 数据可视化色谱
  const dataVizColors = ['#3B82F6', '#06B6D4', '#22C55E', '#F59E0B', '#A855F7', '#E11D48'];

  // 状态色
  const successColor = '#22C55E';
  const warningColor = '#F59E0B';
  const errorColor = '#EF4444';

  // 渐变色 - 科技感霓虹渐变
  const gradientPrimary = isDark 
    ? 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #06B6D4 100%)'
    : 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #0891B2 100%)';
  const gradientGlow = 'linear-gradient(135deg, rgba(99, 102, 241, 0.3) 0%, rgba(139, 92, 246, 0.3) 50%, rgba(6, 182, 212, 0.3) 100%)';

  // 根据模式调整颜色
  return createTheme({
    palette: {
      mode,
      primary: {
        main: primaryBlue,
        dark: '#4F46E5',
        light: '#818CF8',
        contrastText: '#FFFFFF'
      },
      secondary: {
        main: accentCyan,
        dark: '#0891B2',
        light: '#67E8F9',
        contrastText: isDark ? '#0A0E27' : '#FFFFFF'
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
        // 科技风格背景 - 根据模式调整
        default: isDark ? bgDark : bgLight,
        paper: isDark ? 'rgba(15, 23, 42, 0.8)' : '#FFFFFF',
        subtle: isDark ? bgDarkSecondary : '#F1F5F9'
      },
      text: {
        // 高对比度文字颜色
        primary: isDark ? textDarkPrimary : textLightPrimary,
        secondary: isDark ? textDarkSecondary : textLightSecondary,
        disabled: isDark ? '#64748B' : '#94A3B8'
      },
      divider: isDark ? 'rgba(148, 163, 184, 0.2)' : 'rgba(15, 23, 42, 0.08)',
      dataViz: dataVizColors,
      gradient: {
        primary: gradientPrimary,
        glow: gradientGlow
      },
      // 科技风格特殊颜色
      tech: {
        neon: {
          blue: '#3B82F6',
          purple: '#8B5CF6',
          cyan: '#06B6D4',
          pink: '#EC4899'
        },
        glow: {
          blue: 'rgba(59, 130, 246, 0.5)',
          purple: 'rgba(139, 92, 246, 0.5)',
          cyan: 'rgba(6, 182, 212, 0.5)'
        }
      }
    },
    typography: {
      fontFamily:
        '"Inter", "HarmonyOS Sans", "PingFang SC", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      fontSize: 15,
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
      borderRadius: 14
    },
    spacing: 8, // 基础间距单位为8px
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: isDark ? bgDark : bgLight,
            color: isDark ? textDarkPrimary : textLightPrimary,
            scrollbarWidth: 'thin',
            scrollbarColor: isDark ? '#475569 transparent' : '#CBD5E1 transparent',
            '&::-webkit-scrollbar': {
              width: '8px',
              height: '8px'
            },
            '&::-webkit-scrollbar-track': {
              background: 'transparent'
            },
            '&::-webkit-scrollbar-thumb': {
              background: isDark ? '#475569' : '#CBD5E1',
              borderRadius: '4px',
              '&:hover': {
                background: isDark ? '#64748B' : '#94A3B8'
              }
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
            textFillColor: 'transparent',
            fontWeight: 700
          },
          // 科技风格发光效果
          '.tech-glow': {
            boxShadow: isDark
              ? `0 0 20px rgba(99, 102, 241, 0.3), 0 0 40px rgba(139, 92, 246, 0.2)`
              : `0 0 15px rgba(99, 102, 241, 0.15), 0 0 30px rgba(139, 92, 246, 0.1)`
          },
          // 科技风格边框
          '.tech-border': {
            border: isDark
              ? '1px solid rgba(99, 102, 241, 0.3)'
              : '1px solid rgba(226, 232, 240, 1)',
            '&:hover': {
              borderColor: isDark ? primaryBlue : primaryBlue,
              boxShadow: isDark
                ? `0 0 20px rgba(99, 102, 241, 0.3)`
                : `0 0 12px rgba(99, 102, 241, 0.2)`
            }
          }
        }
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: '12px',
            padding: '10px 24px',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          },
          contained: {
            boxShadow: isDark 
              ? '0 4px 14px rgba(99, 102, 241, 0.3)' 
              : '0 4px 14px rgba(99, 102, 241, 0.2)',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: isDark 
                ? '0 8px 24px rgba(99, 102, 241, 0.4)' 
                : '0 8px 24px rgba(99, 102, 241, 0.3)'
            },
            '&:active': {
              transform: 'translateY(0)'
            }
          },
          containedPrimary: {
            background: gradientPrimary,
            color: '#FFFFFF',
            '&:hover': {
              background: isDark
                ? 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #0891B2 100%)'
                : 'linear-gradient(135deg, #4338CA 0%, #6D28D9 50%, #0E7490 100%)',
              boxShadow: isDark 
                ? '0 8px 24px rgba(99, 102, 241, 0.5)' 
                : '0 8px 24px rgba(99, 102, 241, 0.4)'
            }
          },
          containedSecondary: {
            background: isDark 
              ? 'rgba(6, 182, 212, 0.2)' 
              : 'rgba(6, 182, 212, 0.1)',
            color: accentCyan,
            border: `1px solid ${accentCyan}`,
            '&:hover': {
              background: isDark 
                ? 'rgba(6, 182, 212, 0.3)' 
                : 'rgba(6, 182, 212, 0.15)',
              borderColor: accentCyan,
              boxShadow: `0 4px 14px rgba(6, 182, 212, 0.3)`
            }
          },
          outlined: {
            borderWidth: '1.5px',
            borderColor: isDark ? 'rgba(99, 102, 241, 0.5)' : 'rgba(99, 102, 241, 0.4)',
            color: isDark ? textDarkPrimary : primaryBlue,
            '&:hover': {
              borderWidth: '1.5px',
              borderColor: isDark ? primaryBlue : '#4F46E5',
              background: isDark 
                ? 'rgba(99, 102, 241, 0.1)' 
                : 'rgba(99, 102, 241, 0.08)',
              boxShadow: isDark
                ? `0 4px 14px rgba(99, 102, 241, 0.2)`
                : `0 2px 8px rgba(99, 102, 241, 0.15)`
            }
          }
        }
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: isDark 
              ? 'none' 
              : '0 1px 3px rgba(15, 23, 42, 0.08)',
            background: isDark
              ? 'rgba(10, 14, 39, 0.8)'
              : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'saturate(180%) blur(20px)',
            WebkitBackdropFilter: 'saturate(180%) blur(20px)',
            borderBottom: isDark 
              ? '1px solid rgba(99, 102, 241, 0.2)' 
              : '1px solid rgba(226, 232, 240, 0.8)',
            color: isDark ? textDarkPrimary : textLightPrimary
          }
        }
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: '16px',
            backgroundColor: isDark 
              ? 'rgba(15, 23, 42, 0.7)' 
              : '#FFFFFF',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: isDark 
              ? '1px solid rgba(99, 102, 241, 0.2)' 
              : '1px solid rgba(226, 232, 240, 1)',
            boxShadow: isDark
              ? '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(99, 102, 241, 0.1)'
              : '0 1px 3px rgba(15, 23, 42, 0.08), 0 4px 12px rgba(15, 23, 42, 0.04)',
            color: isDark ? textDarkPrimary : textLightPrimary,
            '&:hover': {
              borderColor: isDark ? 'rgba(99, 102, 241, 0.4)' : 'rgba(99, 102, 241, 0.4)',
              boxShadow: isDark
                ? '0 12px 40px rgba(99, 102, 241, 0.2), 0 0 0 1px rgba(99, 102, 241, 0.2)'
                : '0 4px 16px rgba(99, 102, 241, 0.12), 0 0 0 1px rgba(99, 102, 241, 0.2)'
            }
          }
        }
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: '16px',
            backgroundColor: isDark 
              ? 'rgba(15, 23, 42, 0.8)' 
              : '#FFFFFF',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: isDark 
              ? '1px solid rgba(99, 102, 241, 0.15)' 
              : '1px solid rgba(226, 232, 240, 1)',
            boxShadow: isDark
              ? 'none'
              : '0 1px 3px rgba(15, 23, 42, 0.08)',
            color: isDark ? textDarkPrimary : textLightPrimary
          }
        }
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: '8px',
            fontWeight: 500,
            border: isDark 
              ? '1px solid rgba(99, 102, 241, 0.3)' 
              : '1px solid rgba(226, 232, 240, 1)',
            backgroundColor: isDark
              ? 'transparent'
              : '#F8FAFC',
            '&:hover': {
              borderColor: isDark ? primaryBlue : primaryBlue,
              backgroundColor: isDark
                ? 'rgba(99, 102, 241, 0.1)'
                : 'rgba(99, 102, 241, 0.08)',
              boxShadow: isDark
                ? `0 2px 8px rgba(99, 102, 241, 0.2)`
                : `0 1px 4px rgba(99, 102, 241, 0.15)`
            }
          }
        }
      },
      MuiTableHead: {
        styleOverrides: {
          root: {
            '& .MuiTableCell-head': {
              fontWeight: 600,
              backgroundColor: isDark 
                ? 'rgba(99, 102, 241, 0.1)' 
                : '#F8FAFC',
              color: isDark ? textDarkPrimary : textLightPrimary,
              borderBottom: isDark 
                ? '1px solid rgba(99, 102, 241, 0.2)' 
                : '1px solid rgba(226, 232, 240, 1)'
            }
          }
        }
      },
      MuiTabs: {
        styleOverrides: {
          indicator: {
            height: '3px',
            borderRadius: '3px',
            background: gradientPrimary,
            boxShadow: `0 0 10px ${isDark ? 'rgba(99, 102, 241, 0.5)' : 'rgba(99, 102, 241, 0.3)'}`
          }
        }
      },
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 500,
            borderRadius: 10,
            paddingTop: 8,
            paddingBottom: 8,
            color: isDark ? textDarkSecondary : textLightSecondary,
            transition: 'all 0.3s ease',
            '&:hover': {
              color: isDark ? textDarkPrimary : primaryBlue,
              background: isDark 
                ? 'rgba(99, 102, 241, 0.1)' 
                : 'rgba(99, 102, 241, 0.05)'
            },
            '&.Mui-selected': {
              fontWeight: 700,
              color: isDark ? textDarkPrimary : primaryBlue
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
