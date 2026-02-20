'use client';

import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import CloseIcon from '@mui/icons-material/Close';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import TokenOutlinedIcon from '@mui/icons-material/TokenOutlined';
import QuestionAnswerOutlinedIcon from '@mui/icons-material/QuestionAnswerOutlined';
import DatasetOutlinedIcon from '@mui/icons-material/DatasetOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ChatIcon from '@mui/icons-material/Chat';
import ImageIcon from '@mui/icons-material/Image';
import StorageIcon from '@mui/icons-material/Storage';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import GitHubIcon from '@mui/icons-material/GitHub';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import PlaylistPlayIcon from '@mui/icons-material/PlaylistPlay';
import VisibilityIcon from '@mui/icons-material/Visibility';
import UpdateChecker from '../UpdateChecker';
import * as styles from './styles';

/**
 * MobileDrawer 组件
 * 移动端抽屉菜单，包含所有导航项
 */
export default function MobileDrawer({
  theme,
  drawerOpen,
  toggleDrawer,
  expandedMenu,
  toggleMobileSubmenu,
  currentProject,
  onNavigateStart
}) {
  const { t, i18n } = useTranslation();
  const handleNavigateStart = () => {
    onNavigateStart?.();
    toggleDrawer();
  };

  return (
    <Drawer
      id="mobile-navigation-drawer"
      anchor="left"
      open={drawerOpen}
      onClose={toggleDrawer}
      PaperProps={{
        role: 'navigation',
        'aria-label': t('common.mobileNavigation', 'Mobile navigation menu'),
        sx: styles.getDrawerPaperStyles(theme)
      }}
      ModalProps={{
        keepMounted: true // Better mobile performance
      }}
      transitionDuration={300}
      SlideProps={{
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      {/* Drawer Header */}
      <Box sx={styles.getDrawerHeaderStyles(theme)}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box component="img" src="/imgs/logo.svg" alt="Easy Dataset Logo" sx={{ width: 32, height: 32 }} />
          <Typography variant="h6" component="h2" sx={{ fontWeight: 700, fontSize: '1.15rem' }}>
            {t('common.navigation', 'Navigation')}
          </Typography>
        </Box>
        <Tooltip title={t('common.closeMenu', 'Close menu')}>
          <IconButton
            onClick={toggleDrawer}
            aria-label={t('common.closeMenu', 'Close menu')}
            size="medium"
            sx={styles.getDrawerCloseButtonStyles(theme)}
          >
            <CloseIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Drawer Menu List */}
      <List sx={styles.drawerListStyles} role="menu">
        {/* 数据源菜单 */}
        <ListItem disablePadding sx={{ mb: 0.5 }}>
          <ListItemButton
            onClick={() => toggleMobileSubmenu('source')}
            aria-expanded={expandedMenu === 'source'}
            aria-controls="source-submenu"
            role="menuitem"
            sx={styles.getDrawerListItemButtonStyles(theme)}
          >
            <ListItemIcon sx={styles.listItemIconStyles}>
              <DescriptionOutlinedIcon sx={styles.getIconColorStyles(theme)} />
            </ListItemIcon>
            <ListItemText primary={t('common.dataSource')} primaryTypographyProps={styles.listItemTextStyles} />
            {expandedMenu === 'source' ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </ListItemButton>
        </ListItem>
        <Collapse id="source-submenu" in={expandedMenu === 'source'} timeout="auto" unmountOnExit>
          <List component="div" disablePadding role="menu" sx={styles.getDrawerSubmenuContainerStyles(theme)}>
            <ListItemButton
              role="menuitem"
              sx={styles.getDrawerSubmenuItemStyles(theme)}
              component={Link}
              href={`/projects/${currentProject}/text-split`}
              onClick={toggleDrawer}
            >
              <ListItemIcon sx={styles.smallListItemIconStyles}>
                <DescriptionOutlinedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={t('textSplit.title')} primaryTypographyProps={styles.smallListItemTextStyles} />
            </ListItemButton>
            <ListItemButton
              role="menuitem"
              sx={styles.getDrawerSubmenuItemStyles(theme)}
              component={Link}
              href={`/projects/${currentProject}/images`}
              onClick={toggleDrawer}
            >
              <ListItemIcon sx={styles.smallListItemIconStyles}>
                <ImageIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={t('images.title')} primaryTypographyProps={styles.smallListItemTextStyles} />
            </ListItemButton>
          </List>
        </Collapse>

        {/* 数据蒸馏 */}
        <ListItem disablePadding sx={{ mb: 0.5 }}>
          <ListItemButton
            component={Link}
            href={`/projects/${currentProject}/distill`}
            onClick={toggleDrawer}
            role="menuitem"
            sx={styles.getDrawerListItemButtonStyles(theme)}
          >
            <ListItemIcon sx={styles.listItemIconStyles}>
              <TokenOutlinedIcon sx={styles.getIconColorStyles(theme)} />
            </ListItemIcon>
            <ListItemText primary={t('distill.title')} primaryTypographyProps={styles.listItemTextStyles} />
          </ListItemButton>
        </ListItem>

        {/* 问题管理 */}
        <ListItem disablePadding sx={{ mb: 0.5 }}>
          <ListItemButton
            component={Link}
            href={`/projects/${currentProject}/questions`}
            onClick={toggleDrawer}
            role="menuitem"
            sx={styles.getDrawerListItemButtonStyles(theme)}
          >
            <ListItemIcon sx={styles.listItemIconStyles}>
              <QuestionAnswerOutlinedIcon sx={styles.getIconColorStyles(theme)} />
            </ListItemIcon>
            <ListItemText primary={t('questions.title')} primaryTypographyProps={styles.listItemTextStyles} />
          </ListItemButton>
        </ListItem>

        {/* 数据集管理 */}
        <ListItem disablePadding sx={{ mb: 0.5 }}>
          <ListItemButton
            onClick={() => toggleMobileSubmenu('dataset')}
            role="menuitem"
            aria-expanded={expandedMenu === 'dataset'}
            aria-controls="dataset-submenu"
            sx={styles.getDrawerListItemButtonStyles(theme)}
          >
            <ListItemIcon sx={styles.listItemIconStyles}>
              <DatasetOutlinedIcon sx={styles.getIconColorStyles(theme)} />
            </ListItemIcon>
            <ListItemText primary={t('datasets.management')} primaryTypographyProps={styles.listItemTextStyles} />
            {expandedMenu === 'dataset' ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </ListItemButton>
        </ListItem>
        <Collapse in={expandedMenu === 'dataset'} timeout="auto" unmountOnExit id="dataset-submenu">
          <List component="div" disablePadding sx={styles.getDrawerSubmenuContainerStyles(theme)}>
            <ListItemButton
              role="menuitem"
              sx={styles.getDrawerSubmenuItemStyles(theme)}
              component={Link}
              href={`/projects/${currentProject}/datasets`}
              onClick={toggleDrawer}
            >
              <ListItemIcon sx={styles.smallListItemIconStyles}>
                <DatasetOutlinedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={t('datasets.singleTurn', '单轮问答数据集')}
                primaryTypographyProps={styles.smallListItemTextStyles}
              />
            </ListItemButton>
            <ListItemButton
              sx={styles.getDrawerSubmenuItemStyles(theme)}
              component={Link}
              href={`/projects/${currentProject}/multi-turn`}
              onClick={handleNavigateStart}
            >
              <ListItemIcon sx={styles.smallListItemIconStyles}>
                <ChatIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={t('datasets.multiTurn', '多轮对话数据集')}
                primaryTypographyProps={styles.smallListItemTextStyles}
              />
            </ListItemButton>
            <ListItemButton
              sx={styles.getDrawerSubmenuItemStyles(theme)}
              component={Link}
              href={`/projects/${currentProject}/image-datasets`}
              onClick={toggleDrawer}
            >
              <ListItemIcon sx={styles.smallListItemIconStyles}>
                <ImageIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={t('datasets.imageQA', '图片问答数据集')}
                primaryTypographyProps={styles.smallListItemTextStyles}
              />
            </ListItemButton>
          </List>
        </Collapse>

        {/* 评估菜单 */}
        <ListItem disablePadding sx={{ mb: 0.5 }}>
          <ListItemButton
            onClick={() => toggleMobileSubmenu('eval')}
            role="menuitem"
            aria-expanded={expandedMenu === 'eval'}
            aria-controls="eval-submenu"
            sx={styles.getDrawerListItemButtonStyles(theme)}
          >
            <ListItemIcon sx={styles.listItemIconStyles}>
              <AssessmentOutlinedIcon sx={styles.getIconColorStyles(theme)} />
            </ListItemIcon>
            <ListItemText primary={t('eval.title')} primaryTypographyProps={styles.listItemTextStyles} />
            {expandedMenu === 'eval' ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </ListItemButton>
        </ListItem>
        <Collapse in={expandedMenu === 'eval'} timeout="auto" unmountOnExit id="eval-submenu">
          <List component="div" disablePadding sx={styles.getDrawerSubmenuContainerStyles(theme)}>
            <ListItemButton
              role="menuitem"
              sx={styles.getDrawerSubmenuItemStyles(theme)}
              component={Link}
              href={`/projects/${currentProject}/eval-datasets`}
              onClick={handleNavigateStart}
            >
              <ListItemIcon sx={styles.smallListItemIconStyles}>
                <AssessmentOutlinedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={t('eval.datasets')} primaryTypographyProps={styles.smallListItemTextStyles} />
            </ListItemButton>
            <ListItemButton
              role="menuitem"
              sx={styles.getDrawerSubmenuItemStyles(theme)}
              component={Link}
              href={`/projects/${currentProject}/eval-tasks`}
              onClick={handleNavigateStart}
            >
              <ListItemIcon sx={styles.smallListItemIconStyles}>
                <PlaylistPlayIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={t('eval.tasks')} primaryTypographyProps={styles.smallListItemTextStyles} />
            </ListItemButton>
            <ListItemButton
              role="menuitem"
              sx={styles.getDrawerSubmenuItemStyles(theme)}
              component={Link}
              href={`/projects/${currentProject}/blind-test-tasks`}
              onClick={toggleDrawer}
            >
              <ListItemIcon sx={styles.smallListItemIconStyles}>
                <VisibilityIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={t('blindTest.title')} primaryTypographyProps={styles.smallListItemTextStyles} />
            </ListItemButton>
          </List>
        </Collapse>

        {/* 更多菜单 */}
        <ListItem disablePadding sx={{ mb: 0.5 }}>
          <ListItemButton
            onClick={() => toggleMobileSubmenu('more')}
            role="menuitem"
            aria-expanded={expandedMenu === 'more'}
            aria-controls="more-submenu"
            sx={styles.getDrawerListItemButtonStyles(theme)}
          >
            <ListItemIcon sx={styles.listItemIconStyles}>
              <MoreVertIcon sx={styles.getIconColorStyles(theme)} />
            </ListItemIcon>
            <ListItemText primary={t('common.more')} primaryTypographyProps={styles.listItemTextStyles} />
            {expandedMenu === 'more' ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </ListItemButton>
        </ListItem>
        <Collapse in={expandedMenu === 'more'} timeout="auto" unmountOnExit id="more-submenu">
          <List component="div" disablePadding sx={styles.getDrawerSubmenuContainerStyles(theme)}>
            <ListItemButton
              sx={styles.getDrawerSubmenuItemStyles(theme)}
              component={Link}
              href={`/projects/${currentProject}/settings`}
              onClick={toggleDrawer}
            >
              <ListItemIcon sx={styles.smallListItemIconStyles}>
                <SettingsOutlinedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={t('settings.title')} primaryTypographyProps={styles.smallListItemTextStyles} />
            </ListItemButton>
            <ListItemButton
              sx={styles.getDrawerSubmenuItemStyles(theme)}
              component={Link}
              href={`/projects/${currentProject}/playground`}
              onClick={toggleDrawer}
            >
              <ListItemIcon sx={styles.smallListItemIconStyles}>
                <ScienceOutlinedIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={t('playground.title')} primaryTypographyProps={styles.smallListItemTextStyles} />
            </ListItemButton>
            <ListItemButton
              sx={styles.getDrawerSubmenuItemStyles(theme)}
              component={Link}
              href="/dataset-square"
              onClick={toggleDrawer}
            >
              <ListItemIcon sx={styles.smallListItemIconStyles}>
                <StorageIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={t('datasetSquare.title')}
                primaryTypographyProps={styles.smallListItemTextStyles}
              />
            </ListItemButton>
          </List>
        </Collapse>

        {/* Utilities Section */}
        <Box sx={styles.getDrawerUtilitiesStyles(theme)}>
          <ListItem disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              component="a"
              href={
                i18n.language === 'zh-CN' ? 'https://docs.easy-dataset.com/' : 'https://docs.easy-dataset.com/ed/en'
              }
              target="_blank"
              rel="noopener noreferrer"
              onClick={toggleDrawer}
              sx={styles.getDrawerListItemButtonStyles(theme)}
            >
              <ListItemIcon sx={styles.listItemIconStyles}>
                <HelpOutlineIcon sx={styles.getIconColorStyles(theme)} />
              </ListItemIcon>
              <ListItemText
                primary={t('common.documentation', 'Documentation')}
                primaryTypographyProps={styles.listItemTextStyles}
              />
            </ListItemButton>
          </ListItem>

          <ListItem disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              onClick={() => {
                window.open('https://github.com/ConardLi/easy-dataset', '_blank');
                toggleDrawer();
              }}
              sx={styles.getDrawerListItemButtonStyles(theme)}
            >
              <ListItemIcon sx={styles.listItemIconStyles}>
                <GitHubIcon sx={styles.getIconColorStyles(theme)} />
              </ListItemIcon>
              <ListItemText
                primary={t('common.viewOnGitHub', 'View on GitHub')}
                primaryTypographyProps={styles.listItemTextStyles}
              />
            </ListItemButton>
          </ListItem>

          <ListItem disablePadding sx={{ mb: 1 }}>
            <Box sx={{ px: 1, width: '100%' }}>
              <UpdateChecker />
            </Box>
          </ListItem>
        </Box>
      </List>
    </Drawer>
  );
}
