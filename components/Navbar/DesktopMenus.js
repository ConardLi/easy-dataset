'use client';

import React from 'react';
import { Menu, MenuItem, ListItemIcon, ListItemText, Divider } from '@mui/material';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import ImageIcon from '@mui/icons-material/Image';
import DatasetOutlinedIcon from '@mui/icons-material/DatasetOutlined';
import ChatIcon from '@mui/icons-material/Chat';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined';
import StorageIcon from '@mui/icons-material/Storage';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import PlaylistPlayIcon from '@mui/icons-material/PlaylistPlay';
import VisibilityIcon from '@mui/icons-material/Visibility';
import * as styles from './styles';

/**
 * DesktopMenus 缂備礁瀚▎?
 * 婵℃鐭傚鎵博椤栨稑浜鹃柛瀣矎瑜板秹宕￠弴顏嗙闁告牕鎳庨幆鍫ュ极閻楀牆绁︽繝褎鍔戦埀顑跨劍閺嗙喖骞戦鈧▔锔剧不閿涘嫭鍊為柕鍡曠劍濞叉寧寰勫顐ょ憦濞戞搩浜ｈぐ宥夊础?
 */
export default function DesktopMenus({ theme, menuState, isMenuOpen, handleMenuClose, currentProject, onNavigateStart }) {
  const { t } = useTranslation();

  return (
    <>
      {/* 闁轰胶澧楀畵浣糕攦閹邦垰缍呴柛?*/}
      <Menu
        anchorEl={menuState.anchorEl}
        open={isMenuOpen('source')}
        onClose={handleMenuClose}
        hideBackdrop
        disableScrollLock
        sx={{ pointerEvents: 'none' }}
        aria-label={t('common.dataSource', 'Data source menu')}
        PaperProps={{
          elevation: 8,
          sx: {
            ...styles.getMenuPaperStyles(theme),
            pointerEvents: 'auto'
          },
          onMouseLeave: handleMenuClose
        }}
        transformOrigin={{ horizontal: 'center', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'center', vertical: 'bottom' }}
        MenuListProps={{
          dense: false,
          onMouseLeave: handleMenuClose,
          sx: styles.menuListStyles,
          role: 'menu'
        }}
        transitionDuration={200}
      >
        <MenuItem
          component={Link}
          href={`/projects/${currentProject}/text-split`}
          onClick={() => { onNavigateStart?.(); handleMenuClose(); }}
          role="menuitem"
          sx={styles.getMenuItemStyles(theme)}
        >
          <ListItemIcon sx={styles.listItemIconStyles}>
            <DescriptionOutlinedIcon fontSize="small" sx={styles.getPrimaryIconColorStyles(theme)} />
          </ListItemIcon>
          <ListItemText primary={t('textSplit.title')} primaryTypographyProps={styles.smallListItemTextStyles} />
        </MenuItem>
        <Divider sx={{ my: 0.75, mx: 1.5 }} />
        <MenuItem
          component={Link}
          href={`/projects/${currentProject}/images`}
          onClick={() => { onNavigateStart?.(); handleMenuClose(); }}
          role="menuitem"
          sx={styles.getMenuItemStyles(theme)}
        >
          <ListItemIcon sx={styles.listItemIconStyles}>
            <ImageIcon fontSize="small" sx={styles.getPrimaryIconColorStyles(theme)} />
          </ListItemIcon>
          <ListItemText primary={t('images.title')} primaryTypographyProps={styles.smallListItemTextStyles} />
        </MenuItem>
      </Menu>

      {/* 闁轰胶澧楀畵渚€姊块崱娆樺悁闁荤偛妫滆ぐ宥夊础?*/}
      <Menu
        anchorEl={menuState.anchorEl}
        open={isMenuOpen('dataset')}
        onClose={handleMenuClose}
        hideBackdrop
        disableScrollLock
        sx={{ pointerEvents: 'none' }}
        PaperProps={{
          elevation: 8,
          sx: {
            ...styles.getSimpleMenuPaperStyles(theme),
            pointerEvents: 'auto'
          },
          onMouseLeave: handleMenuClose
        }}
        transformOrigin={{ horizontal: 'center', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'center', vertical: 'bottom' }}
        MenuListProps={{
          dense: true,
          onMouseLeave: handleMenuClose,
          sx: styles.simpleMenuListStyles
        }}
      >
        <MenuItem
          component={Link}
          href={`/projects/${currentProject}/datasets`}
          onClick={() => { onNavigateStart?.(); handleMenuClose(); }}
          sx={styles.getSimpleMenuItemStyles(theme)}
        >
          <ListItemIcon sx={styles.smallListItemIconStyles}>
            <DatasetOutlinedIcon fontSize="small" sx={styles.getPrimaryIconColorStyles(theme)} />
          </ListItemIcon>
          <ListItemText
            primary={t('datasets.singleTurn', '单轮问答数据集')}
            primaryTypographyProps={styles.smallListItemTextStyles}
          />
        </MenuItem>
        <Divider sx={{ my: 0.5, mx: 1 }} />
        <MenuItem
          component={Link}
          href={`/projects/${currentProject}/multi-turn`}
          onClick={() => { onNavigateStart?.(); handleMenuClose(); }}
          sx={styles.getSimpleMenuItemStyles(theme)}
        >
          <ListItemIcon sx={styles.smallListItemIconStyles}>
            <ChatIcon fontSize="small" sx={styles.getPrimaryIconColorStyles(theme)} />
          </ListItemIcon>
          <ListItemText
            primary={t('datasets.multiTurn', '多轮对话数据集')}
            primaryTypographyProps={styles.smallListItemTextStyles}
          />
        </MenuItem>
        <Divider sx={{ my: 0.5, mx: 1 }} />
        <MenuItem
          component={Link}
          href={`/projects/${currentProject}/image-datasets`}
          onClick={() => { onNavigateStart?.(); handleMenuClose(); }}
          sx={styles.getSimpleMenuItemStyles(theme)}
        >
          <ListItemIcon sx={styles.smallListItemIconStyles}>
            <ImageIcon fontSize="small" sx={styles.getPrimaryIconColorStyles(theme)} />
          </ListItemIcon>
          <ListItemText
            primary={t('datasets.imageQA', '图片问答数据集')}
            primaryTypographyProps={styles.smallListItemTextStyles}
          />
        </MenuItem>
      </Menu>

      {/* 閻犲洤瀚崣濠囨嚕濠婂啫绀?*/}
      <Menu
        anchorEl={menuState.anchorEl}
        open={isMenuOpen('eval')}
        onClose={handleMenuClose}
        hideBackdrop
        disableScrollLock
        sx={{ pointerEvents: 'none' }}
        PaperProps={{
          elevation: 8,
          sx: {
            ...styles.getSimpleMenuPaperStyles(theme),
            pointerEvents: 'auto'
          },
          onMouseLeave: handleMenuClose
        }}
        transformOrigin={{ horizontal: 'center', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'center', vertical: 'bottom' }}
        MenuListProps={{
          dense: true,
          onMouseLeave: handleMenuClose,
          sx: styles.simpleMenuListStyles
        }}
      >
        <MenuItem
          component={Link}
          href={`/projects/${currentProject}/eval-datasets`}
          onClick={() => { onNavigateStart?.(); handleMenuClose(); }}
          sx={styles.getSimpleMenuItemStyles(theme)}
        >
          <ListItemIcon sx={styles.smallListItemIconStyles}>
            <AssessmentOutlinedIcon fontSize="small" sx={styles.getPrimaryIconColorStyles(theme)} />
          </ListItemIcon>
          <ListItemText primary={t('eval.datasets')} primaryTypographyProps={styles.smallListItemTextStyles} />
        </MenuItem>
        <Divider sx={{ my: 0.5, mx: 1 }} />
        <MenuItem
          component={Link}
          href={`/projects/${currentProject}/eval-tasks`}
          onClick={() => { onNavigateStart?.(); handleMenuClose(); }}
          sx={styles.getSimpleMenuItemStyles(theme)}
        >
          <ListItemIcon sx={styles.smallListItemIconStyles}>
            <PlaylistPlayIcon fontSize="small" sx={styles.getPrimaryIconColorStyles(theme)} />
          </ListItemIcon>
          <ListItemText primary={t('eval.tasks')} primaryTypographyProps={styles.smallListItemTextStyles} />
        </MenuItem>
        <Divider sx={{ my: 0.5, mx: 1 }} />
        <MenuItem
          component={Link}
          href={`/projects/${currentProject}/blind-test-tasks`}
          onClick={() => { onNavigateStart?.(); handleMenuClose(); }}
          sx={styles.getSimpleMenuItemStyles(theme)}
        >
          <ListItemIcon sx={styles.smallListItemIconStyles}>
            <VisibilityIcon fontSize="small" sx={styles.getPrimaryIconColorStyles(theme)} />
          </ListItemIcon>
          <ListItemText primary={t('blindTest.title')} primaryTypographyProps={styles.smallListItemTextStyles} />
        </MenuItem>
      </Menu>

      {/* 闁哄洦娼欓ˇ鍧楁嚕濠婂啫绀?*/}
      <Menu
        anchorEl={menuState.anchorEl}
        open={isMenuOpen('more')}
        onClose={handleMenuClose}
        hideBackdrop
        disableScrollLock
        sx={{ pointerEvents: 'none' }}
        PaperProps={{
          elevation: 8,
          sx: {
            ...styles.getSimpleMenuPaperStyles(theme),
            pointerEvents: 'auto'
          },
          onMouseLeave: handleMenuClose
        }}
        transformOrigin={{ horizontal: 'center', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'center', vertical: 'bottom' }}
        MenuListProps={{
          dense: true,
          onMouseLeave: handleMenuClose,
          sx: styles.simpleMenuListStyles
        }}
      >
        <MenuItem
          component={Link}
          href={`/projects/${currentProject}/settings`}
          onClick={() => { onNavigateStart?.(); handleMenuClose(); }}
          sx={styles.getSimpleMenuItemStyles(theme)}
        >
          <ListItemIcon sx={styles.smallListItemIconStyles}>
            <SettingsOutlinedIcon fontSize="small" sx={styles.getPrimaryIconColorStyles(theme)} />
          </ListItemIcon>
          <ListItemText primary={t('settings.title')} primaryTypographyProps={styles.smallListItemTextStyles} />
        </MenuItem>
        <Divider sx={{ my: 0.5, mx: 1 }} />
        <MenuItem
          component={Link}
          href={`/projects/${currentProject}/playground`}
          onClick={() => { onNavigateStart?.(); handleMenuClose(); }}
          sx={styles.getSimpleMenuItemStyles(theme)}
        >
          <ListItemIcon sx={styles.smallListItemIconStyles}>
            <ScienceOutlinedIcon fontSize="small" sx={styles.getPrimaryIconColorStyles(theme)} />
          </ListItemIcon>
          <ListItemText primary={t('playground.title')} primaryTypographyProps={styles.smallListItemTextStyles} />
        </MenuItem>
        <Divider sx={{ my: 0.5, mx: 1 }} />
        <MenuItem
          component={Link}
          href="/dataset-square"
          onClick={() => { onNavigateStart?.(); handleMenuClose(); }}
          sx={styles.getSimpleMenuItemStyles(theme)}
        >
          <ListItemIcon sx={styles.smallListItemIconStyles}>
            <StorageIcon fontSize="small" sx={styles.getPrimaryIconColorStyles(theme)} />
          </ListItemIcon>
          <ListItemText primary={t('datasetSquare.title')} primaryTypographyProps={styles.smallListItemTextStyles} />
        </MenuItem>
      </Menu>
    </>
  );
}
