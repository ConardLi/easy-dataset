import React from 'react';
import { Tabs, Tab, useTheme } from '@mui/material';

/**
 * 顶部分类选择标签页组件
 */
const CategoryTabs = ({ categoryEntries, selectedCategory, currentLanguage, onCategoryChange }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Tabs
      value={selectedCategory}
      onChange={(e, newValue) => {
        onCategoryChange(newValue);
      }}
      variant="scrollable"
      scrollButtons="auto"
      sx={{ 
        borderBottom: `1px solid ${isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.15)'}`, 
        mb: 3,
        '& .MuiTab-root': {
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.9375rem',
          color: isDark ? theme.palette.text.secondary : '#64748B',
          minHeight: 48,
          transition: 'all 0.3s ease',
          '&:hover': {
            color: isDark ? '#FFFFFF' : theme.palette.primary.main,
            bgcolor: isDark ? 'rgba(99, 102, 241, 0.12)' : 'rgba(99, 102, 241, 0.08)'
          }
        },
        '& .Mui-selected': {
          color: '#FFFFFF !important',
          background: theme.palette.gradient?.primary || 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
          boxShadow: isDark
            ? '0 4px 16px rgba(99, 102, 241, 0.4)'
            : '0 4px 16px rgba(99, 102, 241, 0.35)',
          '&:hover': {
            background: theme.palette.gradient?.primary || 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
            opacity: 0.95
          }
        },
        '& .MuiTabs-indicator': {
          display: 'none'
        }
      }}
    >
      {categoryEntries.map(([categoryKey, categoryConfig]) => (
        <Tab 
          key={categoryKey} 
          label={categoryConfig.displayName[currentLanguage]} 
          value={categoryKey}
          sx={{
            borderRadius: '12px',
            mx: 0.5,
            '&.Mui-selected': {
              borderRadius: '12px'
            }
          }}
        />
      ))}
    </Tabs>
  );
};

export default CategoryTabs;
