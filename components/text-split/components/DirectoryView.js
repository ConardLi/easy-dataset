'use client';

import { Box, List, ListItem, ListItemIcon, ListItemText, Collapse, IconButton } from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import ArticleIcon from '@mui/icons-material/Article';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { useTheme } from '@mui/material/styles';

/**
 * 目录结构组件
 * @param {Object} props
 * @param {Array} props.items - 目录项数组
 * @param {Object} props.expandedItems - 展开状态对象
 * @param {Function} props.onToggleItem - 展开/折叠回调
 * @param {number} props.level - 当前层级
 * @param {string} props.parentId - 父级ID
 */
export default function DirectoryView({ items, expandedItems, onToggleItem, level = 0, parentId = '' }) {
  const theme = useTheme();

  if (!items || items.length === 0) return null;

  return (
    <List sx={{ pl: level > 0 ? 2 : 0 }}>
      {items.map((item, index) => {
        const itemId = `${parentId}-${index}`;
        const hasChildren = item.children && item.children.length > 0;
        const isExpanded = expandedItems[itemId] || false;

        return (
          <Box key={itemId}>
            <ListItem
              sx={{
                pl: level * 2,
                borderLeft: level > 0 ? `1px solid ${theme.palette.divider}` : 'none',
                ml: level > 0 ? 1 : 0
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                {hasChildren ? <FolderIcon color="primary" /> : <ArticleIcon color="info" />}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                primaryTypographyProps={{
                  fontWeight: level === 0 ? 'bold' : 'normal',
                  variant: level === 0 ? 'subtitle1' : 'body2'
                }}
              />
              {hasChildren && (
                <IconButton size="small" onClick={() => onToggleItem(itemId)}>
                  {isExpanded ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
              )}
            </ListItem>

            {hasChildren && (
              <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                <DirectoryView
                  items={item.children}
                  expandedItems={expandedItems}
                  onToggleItem={onToggleItem}
                  level={level + 1}
                  parentId={itemId}
                />
              </Collapse>
            )}
          </Box>
        );
      })}
    </List>
  );
}
