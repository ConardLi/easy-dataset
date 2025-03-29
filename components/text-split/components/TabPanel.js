'use client';

import { Box } from '@mui/material';

/**
 * 标签页面板组件
 * @param {Object} props
 * @param {number} props.value - 当前激活的标签索引
 * @param {number} props.index - 当前面板对应的索引
 * @param {ReactNode} props.children - 子组件
 */
export default function TabPanel({ value, index, children }) {
  return (
    <Box
      role="tabpanel"
      hidden={value !== index}
      id={`domain-tabpanel-${index}`}
      aria-labelledby={`domain-tab-${index}`}
      sx={{ height: '100%' }}
    >
      {value === index && <Box sx={{ height: '100%' }}>{children}</Box>}
    </Box>
  );
}
