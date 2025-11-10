'use client';

import { Box, Paper, Tab, Tabs } from '@mui/material';
import { motion } from 'framer-motion';
import TabPanel from '@/components/text-split/components/TabPanel';

const SHELL_SX = theme => ({
  borderRadius: '24px',
  overflow: 'hidden',
  background: theme.palette.mode === 'dark' ? 'rgba(11, 16, 33, 0.92)' : '#FFFFFF',
  border: theme.palette.mode === 'dark'
    ? '1px solid rgba(99,102,241,0.22)'
    : '1px solid rgba(208, 213, 221, 0.65)',
  boxShadow: theme.palette.mode === 'dark'
    ? '0 28px 80px -36px rgba(37, 99, 235, 0.45)'
    : '0 32px 96px -44px rgba(15, 23, 42, 0.22)',
  position: 'relative'
});

const BODY_SX = theme => ({
  position: 'relative',
  px: { xs: 2, md: 4 },
  pt: { xs: 3, md: 4 },
  pb: { xs: 3.5, md: 5 },
  background: theme.palette.mode === 'dark'
    ? 'linear-gradient(150deg, rgba(6,9,20,0.96) 0%, rgba(15,23,42,0.88) 55%, rgba(59,130,246,0.25) 120%)'
    : 'linear-gradient(150deg, rgba(248,250,255,0.96) 0%, rgba(229,236,255,0.88) 50%, rgba(191,219,254,0.42) 120%)',
  borderTop: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(99,102,241,0.2)' : 'rgba(148,163,184,0.26)'}`
});

function TabsHeader({ activeTab, onTabChange, labels }) {
  return (
    <Tabs
      value={activeTab}
      onChange={onTabChange}
      variant="fullWidth"
      sx={{
        px: { xs: 1.5, md: 2 },
        pt: 2,
        '& .MuiTabs-indicator': { display: 'none' },
        '& .MuiTab-root': {
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.95rem',
          borderRadius: '14px',
          minHeight: 46,
          transition: 'all 0.3s ease',
          '&.Mui-selected': {
            color: '#fff',
            background: theme => theme.palette.gradient.primary,
            boxShadow: theme =>
              theme.palette.mode === 'dark'
                ? '0 6px 18px rgba(99,102,241,0.4)'
                : '0 8px 22px rgba(99,102,241,0.3)'
          }
        }
      }}
    >
      {labels.map(label => (
        <Tab label={label} key={label} />
      ))}
    </Tabs>
  );
}

export default function WorkspaceShell({ activeTab, onTabChange, tabs, filterContent }) {
  return (
    <Paper component={motion.div} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} sx={SHELL_SX}>
      <TabsHeader activeTab={activeTab} onTabChange={onTabChange} labels={tabs.map(tab => tab.label)} />

      <Box sx={BODY_SX}>
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            backgroundSize: '56px 56px',
            backgroundImage: theme =>
              theme.palette.mode === 'dark'
                ? `linear-gradient(rgba(59,130,246,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.06) 1px, transparent 1px)`
                : `linear-gradient(rgba(59,130,246,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.05) 1px, transparent 1px)`,
            opacity: 0.35,
            pointerEvents: 'none'
          }}
        />

        <Box
          sx={{
            position: 'absolute',
            width: { xs: 240, md: 360 },
            height: { xs: 240, md: 360 },
            bottom: { xs: -140, md: -160 },
            left: { xs: -120, md: -140 },
            background: theme =>
              theme.palette.mode === 'dark'
                ? 'radial-gradient(circle, rgba(14,165,233,0.4), transparent 65%)'
                : 'radial-gradient(circle, rgba(56,189,248,0.28), transparent 65%)',
            filter: 'blur(40px)',
            opacity: 0.85,
            pointerEvents: 'none'
          }}
        />

        <Box sx={{ position: 'relative', zIndex: 2 }}>
          {filterContent && <Box sx={{ mb: { xs: 3, md: 4 } }}>{filterContent}</Box>}

          {tabs.map((tab, index) => (
            <TabPanel value={activeTab} index={index} key={tab.label}>
              {tab.content}
            </TabPanel>
          ))}
        </Box>
      </Box>
    </Paper>
  );
}

