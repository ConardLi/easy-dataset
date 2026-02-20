'use client';

import React, { useState, useRef, useEffect } from 'react';
import { AppBar, Toolbar, Box, IconButton, useTheme as useMuiTheme, Tooltip, useMediaQuery, LinearProgress } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import MenuIcon from '@mui/icons-material/Menu';

// 样式
import * as styles from './styles';

// 子组件
import Logo from './Logo';
import ActionButtons from './ActionButtons';
import NavigationTabs from './NavigationTabs';
import MobileDrawer from './MobileDrawer';
import DesktopMenus from './DesktopMenus';
import ContextBar from './ContextBar';

export default function Navbar({ projects = [], currentProject }) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const theme = useMuiTheme();
  const { resolvedTheme, setTheme } = useTheme();
  const isProjectDetail = pathname.includes('/projects/') && pathname.split('/').length > 3;

  // 检测移动设备
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));

  // 移动端抽屉状态
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState(null);

  // 桌面端菜单状态
  const [menuState, setMenuState] = useState({ anchorEl: null, menuType: null });
  const [navLoading, setNavLoading] = useState(false);
  const navLoadingTimeoutRef = useRef(null);

  // ContextBar 悬浮状态
  const [contextBarHovered, setContextBarHovered] = useState(false);
  const contextTriggerRef = useRef(null);
  const contextBarRef = useRef(null);

  useEffect(() => {
    if (!contextBarHovered) return;

    const handleOutsideClick = event => {
      if (contextBarRef.current?.contains(event.target)) return;
      if (contextTriggerRef.current?.contains(event.target)) return;
      const projectMenuEl = document.getElementById('project-menu');
      if (projectMenuEl?.contains(event.target)) return;
      setContextBarHovered(false);
    };

    document.addEventListener('pointerdown', handleOutsideClick, true);
    return () => {
      document.removeEventListener('pointerdown', handleOutsideClick, true);
    };
  }, [contextBarHovered]);

  useEffect(() => {
    if (!menuState.menuType) return;

    const handleOutsideMenuClick = event => {
      if (menuState.anchorEl?.contains(event.target)) return;
      if (event.target?.closest?.('.MuiMenu-root')) return;
      setMenuState({ anchorEl: null, menuType: null });
    };

    document.addEventListener('pointerdown', handleOutsideMenuClick, true);
    return () => {
      document.removeEventListener('pointerdown', handleOutsideMenuClick, true);
    };
  }, [menuState.anchorEl, menuState.menuType]);

  useEffect(() => {
    setNavLoading(false);
    if (navLoadingTimeoutRef.current) {
      clearTimeout(navLoadingTimeoutRef.current);
      navLoadingTimeoutRef.current = null;
    }
  }, [pathname]);

  useEffect(() => {
    if (!isProjectDetail || !currentProject) return;
    const prefetchRoutes = [
      `/projects/${currentProject}/multi-turn`,
      `/projects/${currentProject}/eval-datasets`,
      `/projects/${currentProject}/eval-tasks`
    ];
    prefetchRoutes.forEach(route => router.prefetch(route));
  }, [router, currentProject, isProjectDetail]);

  useEffect(() => {
    return () => {
      if (navLoadingTimeoutRef.current) {
        clearTimeout(navLoadingTimeoutRef.current);
      }
    };
  }, []);

  const handleNavigateStart = () => {
    setNavLoading(true);
    if (navLoadingTimeoutRef.current) {
      clearTimeout(navLoadingTimeoutRef.current);
    }
    navLoadingTimeoutRef.current = setTimeout(() => {
      setNavLoading(false);
      navLoadingTimeoutRef.current = null;
    }, 12000);
  };

  const handleMenuOpen = (event, menuType) => {
    setMenuState({ anchorEl: event.currentTarget, menuType });
  };

  const handleMenuClose = () => {
    setMenuState({ anchorEl: null, menuType: null });
  };

  const isMenuOpen = menuType => menuState.menuType === menuType;

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
    setExpandedMenu(null);
  };

  const toggleMobileSubmenu = menuType => {
    setExpandedMenu(expandedMenu === menuType ? null : menuType);
  };

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <>
      <AppBar
        component="nav"
        position="sticky"
        elevation={0}
        color={theme.palette.mode === 'dark' ? 'transparent' : 'primary'}
        sx={styles.getAppBarStyles(theme)}
        style={{ borderRadius: 0, zIndex: 1200 }}
        role="navigation"
        aria-label={t('common.mainNavigation', 'Main navigation')}
      >
        <Toolbar sx={styles.toolbarStyles}>
          {/* 左侧: 汉堡菜单(移动端) + Logo */}
          <Box
            ref={contextTriggerRef}
            sx={styles.logoContainerStyles}
            onMouseEnter={() => isProjectDetail && setContextBarHovered(true)}
          >
            {/* 汉堡菜单按钮 */}
            {isProjectDetail && isMobile && (
              <Tooltip title={t('common.menu', 'Menu')} placement="bottom">
                <IconButton
                  onClick={toggleDrawer}
                  size="medium"
                  aria-label={t('common.openMenu', 'Open navigation menu')}
                  aria-expanded={drawerOpen}
                  aria-controls="mobile-navigation-drawer"
                  sx={styles.getHamburgerButtonStyles(theme)}
                >
                  <MenuIcon />
                </IconButton>
              </Tooltip>
            )}

            {/* Logo 组件 */}
            <Logo theme={theme} />
          </Box>

          {/* 中间导航 - 仅桌面端 */}
          {isProjectDetail && !isMobile && (
            <NavigationTabs
              theme={theme}
              pathname={pathname}
              currentProject={currentProject}
              handleMenuOpen={handleMenuOpen}
              handleMenuClose={handleMenuClose}
              onNavigateStart={handleNavigateStart}
            />
          )}

          {/* 右侧操作区 */}
          <ActionButtons
            theme={theme}
            resolvedTheme={resolvedTheme}
            toggleTheme={toggleTheme}
            isProjectDetail={isProjectDetail}
            currentProject={currentProject}
            onActionAreaEnter={!isMobile ? handleMenuClose : undefined}
          />
        </Toolbar>
        {isProjectDetail && (
          <LinearProgress
            color="secondary"
            sx={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: 2,
              opacity: navLoading ? 1 : 0,
              transition: 'opacity 180ms ease'
            }}
          />
        )}
      </AppBar>

      {/* ContextBar - 在 Logo 或 ContextBar 悬浮时展示 */}
      {isProjectDetail && contextBarHovered && (
        <Box ref={contextBarRef} onMouseLeave={() => setContextBarHovered(false)}>
          <ContextBar
            projects={projects}
            currentProjectId={currentProject}
            onMouseLeave={() => setContextBarHovered(false)}
          />
        </Box>
      )}

      {/* 移动端抽屉组件 */}
      <MobileDrawer
        theme={theme}
        drawerOpen={drawerOpen}
        toggleDrawer={toggleDrawer}
        expandedMenu={expandedMenu}
        toggleMobileSubmenu={toggleMobileSubmenu}
        currentProject={currentProject}
        onNavigateStart={handleNavigateStart}
      />

      {/* 桌面端菜单组件 */}
      <DesktopMenus
        theme={theme}
        menuState={menuState}
        isMenuOpen={isMenuOpen}
        handleMenuClose={handleMenuClose}
        currentProject={currentProject}
        onNavigateStart={handleNavigateStart}
      />
    </>
  );
}
