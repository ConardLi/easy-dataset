'use client';

import React from 'react';
import { Box, Tabs, Tab } from '@mui/material';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import TokenOutlinedIcon from '@mui/icons-material/TokenOutlined';
import QuestionAnswerOutlinedIcon from '@mui/icons-material/QuestionAnswerOutlined';
import DatasetOutlinedIcon from '@mui/icons-material/DatasetOutlined';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import * as styles from './styles';

/**
 * NavigationTabs 组件
 * 桌面端导航 Tabs，包含数据源、数据蒸馏、问题管理、数据集管理、更多等 Tab
 */
export default function NavigationTabs({ theme, pathname, currentProject, handleMenuOpen, handleMenuClose, onNavigateStart }) {
  const { t } = useTranslation();

  // 计算当前 Tab 值
  const getCurrentTabValue = () => {
    if (pathname.includes('/settings') || pathname.includes('/playground') || pathname.includes('/datasets-sq')) {
      return 'more';
    }
    if (pathname.includes('/eval-datasets') || pathname.includes('/eval-tasks')) {
      return 'eval';
    }
    if (pathname.includes('/datasets') || pathname.includes('/multi-turn') || pathname.includes('/image-datasets')) {
      return 'datasets';
    }
    if (pathname.includes('/text-split') || pathname.includes('/images')) {
      return 'source';
    }
    return pathname;
  };

  return (
    <Box sx={styles.navContainerStyles}>
      <Tabs
        value={getCurrentTabValue()}
        textColor="inherit"
        indicatorColor="secondary"
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        sx={styles.getTabsStyles(theme)}
      >
        <Tab
          icon={<DescriptionOutlinedIcon fontSize="small" />}
          iconPosition="start"
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
              {t('common.dataSource')}
              <ArrowDropDownIcon fontSize="small" sx={{ ml: 0.25 }} />
            </Box>
          }
          value="source"
          onMouseEnter={e => handleMenuOpen(e, 'source')}
          sx={styles.tabIconWrapperStyles}
        />
        <Tab
          icon={<TokenOutlinedIcon fontSize="small" />}
          iconPosition="start"
          label={t('distill.title')}
          value={`/projects/${currentProject}/distill`}
          component={Link}
          href={`/projects/${currentProject}/distill`}
          onClick={() => {
            onNavigateStart?.();
            handleMenuClose();
          }}
          sx={styles.tabIconWrapperStyles}
        />
        <Tab
          icon={<QuestionAnswerOutlinedIcon fontSize="small" />}
          iconPosition="start"
          label={t('questions.title')}
          value={`/projects/${currentProject}/questions`}
          component={Link}
          href={`/projects/${currentProject}/questions`}
          onClick={() => {
            onNavigateStart?.();
            handleMenuClose();
          }}
          sx={styles.tabIconWrapperStyles}
        />
        <Tab
          icon={<DatasetOutlinedIcon fontSize="small" />}
          iconPosition="start"
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
              {t('datasets.management')}
              <ArrowDropDownIcon fontSize="small" sx={{ ml: 0.25 }} />
            </Box>
          }
          value="datasets"
          onMouseEnter={e => handleMenuOpen(e, 'dataset')}
          sx={styles.tabIconWrapperStyles}
        />
        <Tab
          icon={<AssessmentOutlinedIcon fontSize="small" />}
          iconPosition="start"
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
              {t('eval.title')}
              <ArrowDropDownIcon fontSize="small" sx={{ ml: 0.25 }} />
            </Box>
          }
          value="eval"
          onMouseEnter={e => handleMenuOpen(e, 'eval')}
          sx={styles.tabIconWrapperStyles}
        />
        <Tab
          icon={<MoreVertIcon fontSize="small" />}
          iconPosition="start"
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
              {t('common.more')}
              <ArrowDropDownIcon fontSize="small" sx={{ ml: 0.25 }} />
            </Box>
          }
          onMouseEnter={e => handleMenuOpen(e, 'more')}
          value="more"
          sx={styles.tabIconWrapperStyles}
        />
      </Tabs>
    </Box>
  );
}
