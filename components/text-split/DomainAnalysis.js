'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Paper,
  Typography,
  Divider,
  CircularProgress,
  Tabs,
  Tab,
  List,
  Collapse,
  IconButton,
  TextField,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Tooltip,
  Menu,
  MenuItem
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import TabPanel from './components/TabPanel';
import ReactMarkdown from 'react-markdown';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import axios from 'axios';
import { toast } from 'sonner';

import 'github-markdown-css/github-markdown-light.css';

/**
 * 领域分析组件
 * @param {Object} props
 * @param {string} props.projectId - 项目ID
 * @param {Array} props.toc - 目录结构数组
 * @param {Array} props.tags - 标签树数组
 * @param {boolean} props.loading - 是否加载中
 * @param {Function} props.onTagsUpdate - 标签更新回调
 */

// 领域树节点组件
function TreeNode({ node, level = 0, onEdit, onDelete, onAddChild }) {
  const [open, setOpen] = useState(true);
  const theme = useTheme();
  const hasChildren = node.child && node.child.length > 0;
  const [anchorEl, setAnchorEl] = useState(null);
  const menuOpen = Boolean(anchorEl);
  const { t } = useTranslation();

  const handleClick = () => {
    if (hasChildren) {
      setOpen(!open);
    }
  };

  const handleMenuOpen = event => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = event => {
    if (event) event.stopPropagation();
    setAnchorEl(null);
  };

  const handleEdit = event => {
    event.stopPropagation();
    onEdit(node);
    handleMenuClose();
  };

  const handleDelete = event => {
    event.stopPropagation();
    onDelete(node);
    handleMenuClose();
  };

  const handleAddChild = event => {
    event.stopPropagation();
    onAddChild(node);
    handleMenuClose();
  };

  const isRootNode = level === 0;
  const isDarkMode = theme.palette.mode === 'dark';
  
  // 完全重新设计的科技风格配色 - 确保白天模式高对比度
  // 白天模式：使用深色文字 + 明显的背景色区分
  // 夜间模式：使用浅色文字 + 深色背景
  
  // 根节点背景色 - 白天模式使用明显的蓝色背景，夜间模式使用深色背景
  const rootIdleBackground = isDarkMode
    ? alpha(theme.palette.primary.main, 0.14)
    : '#E0E7FF'; // 白天模式使用明显的浅蓝色背景
  const rootHoverBackground = isDarkMode
    ? alpha(theme.palette.primary.main, 0.24)
    : '#C7D2FE'; // 白天模式hover时使用更深的蓝色
  const rootActiveBackground = isDarkMode
    ? alpha(theme.palette.primary.main, 0.32)
    : '#A5B4FC'; // 白天模式选中时使用更深的蓝色
  
  // 子节点背景色 - 白天模式使用白色/浅灰，夜间模式使用透明
  const nestedIdleBackground = isDarkMode
    ? alpha(theme.palette.primary.main, 0.06)
    : '#FFFFFF'; // 白天模式使用纯白背景
  const nestedHoverBackground = isDarkMode
    ? alpha(theme.palette.primary.main, 0.12)
    : '#F8FAFC'; // 白天模式hover时使用浅灰
  
  // 文字颜色 - 白天模式使用蓝色系，夜间模式使用浅色
  const rootTextColor = isDarkMode ? '#E0E7FF' : '#4F46E5'; // 白天模式使用深蓝色文字（不是黑色）
  const nestedTextColor = isDarkMode ? theme.palette.text.primary : '#6366F1'; // 白天模式使用蓝色文字（不是黑色）
  
  // 边框颜色
  const rootBorderColor = isDarkMode
    ? alpha(theme.palette.primary.main, 0.3)
    : '#818CF8'; // 白天模式使用明显的蓝色边框
  const nestedBorderColor = isDarkMode
    ? alpha(theme.palette.primary.main, 0.15)
    : '#E2E8F0'; // 白天模式使用浅灰边框
  
  // 连接线颜色
  const branchColor = isDarkMode
    ? alpha(theme.palette.primary.main, 0.35)
    : '#818CF8'; // 白天模式使用明显的蓝色连接线

  return (
    <>
      <Box
        sx={{
          mb: 1,
          pl: level * 2 + 2,
          position: 'relative'
        }}
      >
        <Box
          component="div"
          onClick={handleClick}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pl: 2,
            pr: 1.5,
            py: 1.25,
            bgcolor: isRootNode ? rootIdleBackground : nestedIdleBackground,
            color: isRootNode ? rootTextColor : nestedTextColor,
            border: isRootNode
              ? `1.5px solid ${rootBorderColor}`
              : `1px solid ${nestedBorderColor}`,
            borderRadius: '14px',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: isRootNode
              ? isDarkMode
                ? '0 4px 12px rgba(99, 102, 241, 0.2)'
                : '0 4px 12px rgba(99, 102, 241, 0.2), 0 0 0 1px rgba(99, 102, 241, 0.1)'
              : isDarkMode
                ? 'none'
                : '0 1px 3px rgba(15, 23, 42, 0.08)',
            position: 'relative',
            cursor: 'pointer',
            '&:hover': {
              bgcolor: isRootNode ? rootHoverBackground : nestedHoverBackground,
              transform: 'translateX(4px)',
              boxShadow: isRootNode
                ? isDarkMode
                  ? '0 8px 20px rgba(99, 102, 241, 0.3)'
                  : '0 8px 20px rgba(99, 102, 241, 0.3), 0 0 0 1px rgba(99, 102, 241, 0.2)'
                : isDarkMode
                  ? `0 2px 8px ${alpha(theme.palette.primary.main, 0.2)}`
                  : '0 4px 12px rgba(15, 23, 42, 0.12)',
              borderColor: isRootNode
                ? (isDarkMode ? alpha(theme.palette.primary.main, 0.4) : '#6366F1')
                : (isDarkMode ? alpha(theme.palette.primary.main, 0.25) : '#CBD5E1')
            },
            '&:active': {
              bgcolor: isRootNode ? rootActiveBackground : nestedHoverBackground
            },
            // 左侧连接线指示器
            '&::before': level > 0 && !isRootNode ? {
              content: '""',
              position: 'absolute',
              left: -2,
              top: '50%',
              transform: 'translateY(-50%)',
              width: '3px',
              height: '70%',
              background: branchColor,
              borderRadius: '0 2px 2px 0',
              boxShadow: isDarkMode
                ? `0 0 8px ${alpha(theme.palette.primary.main, 0.3)}`
                : `0 0 6px ${alpha(theme.palette.primary.main, 0.2)}`
            } : {}
          }}
        >
          <Typography
            sx={{
              fontWeight: level === 0 ? 700 : 600,
              fontSize: level === 0 ? '1rem' : '0.9375rem',
              letterSpacing: level === 0 ? '-0.01em' : '0.01em',
              color: isRootNode ? rootTextColor : nestedTextColor,
              flex: 1
            }}
          >
            {node.label}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <IconButton
              size="small"
              onClick={handleMenuOpen}
              sx={{
                color: isRootNode
                  ? (isDarkMode ? '#E0E7FF' : '#4F46E5')
                  : (isDarkMode ? theme.palette.text.secondary : '#64748B'),
                backgroundColor: isDarkMode
                  ? alpha(theme.palette.primary.main, 0.12)
                  : '#FFFFFF',
                border: `1px solid ${isDarkMode ? alpha(theme.palette.primary.main, 0.2) : '#E2E8F0'}`,
                borderRadius: '10px',
                width: 32,
                height: 32,
                transition: 'all 0.2s ease',
                boxShadow: isDarkMode
                  ? 'none'
                  : '0 1px 3px rgba(15, 23, 42, 0.08)',
                '&:hover': {
                  bgcolor: isDarkMode
                    ? alpha(theme.palette.primary.main, 0.22)
                    : '#F1F5F9',
                  borderColor: isDarkMode
                    ? alpha(theme.palette.primary.main, 0.3)
                    : '#CBD5E1',
                  transform: 'scale(1.05)',
                  boxShadow: isDarkMode
                    ? `0 4px 12px ${alpha(theme.palette.primary.main, 0.25)}`
                    : '0 4px 12px rgba(15, 23, 42, 0.12)'
                }
              }}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
            {hasChildren && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 30,
                  height: 30,
                  borderRadius: '10px',
                  backgroundColor: isDarkMode
                    ? alpha(theme.palette.primary.main, 0.15)
                    : '#FFFFFF',
                  border: `1px solid ${isDarkMode ? alpha(theme.palette.primary.main, 0.25) : '#E2E8F0'}`,
                  color: isRootNode
                    ? (isDarkMode ? '#E0E7FF' : '#4F46E5')
                    : (isDarkMode ? theme.palette.text.secondary : '#64748B'),
                  transition: 'all 0.2s ease',
                  boxShadow: isDarkMode
                    ? 'none'
                    : '0 1px 3px rgba(15, 23, 42, 0.08)',
                  '&:hover': {
                    backgroundColor: isDarkMode
                      ? alpha(theme.palette.primary.main, 0.25)
                      : '#F1F5F9',
                    borderColor: isDarkMode
                      ? alpha(theme.palette.primary.main, 0.35)
                      : '#CBD5E1',
                    boxShadow: isDarkMode
                      ? `0 4px 12px ${alpha(theme.palette.primary.main, 0.25)}`
                      : '0 4px 12px rgba(15, 23, 42, 0.12)'
                  }
                }}
              >
                {open ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
              </Box>
            )}
          </Box>
        </Box>

        <Menu anchorEl={anchorEl} open={menuOpen} onClose={handleMenuClose} onClick={e => e.stopPropagation()}>
          <MenuItem onClick={handleEdit}>
            <EditIcon fontSize="small" sx={{ mr: 1 }} />
            {t('textSplit.editTag')}
          </MenuItem>
          <MenuItem onClick={handleDelete}>
            <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
            {t('textSplit.deleteTag')}
          </MenuItem>
          {level === 0 && (
            <MenuItem onClick={handleAddChild}>
              <AddIcon fontSize="small" sx={{ mr: 1 }} />
              {t('textSplit.addTag')}
            </MenuItem>
          )}
        </Menu>
      </Box>

      {hasChildren && (
        <Collapse in={open} timeout="auto" unmountOnExit>
          <List
            component="div"
            disablePadding
            sx={{
              mt: 1,
              ml: level === 0 ? 2.5 : 0,
              pl: level === 0 ? 2.5 : 0,
              borderLeft: level === 0 ? `3px solid ${branchColor}` : 'none',
              position: 'relative',
              '&::before': level === 0 ? {
                content: '""',
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: '3px',
                background: isDarkMode
                  ? `linear-gradient(180deg, ${branchColor} 0%, transparent 100%)`
                  : `linear-gradient(180deg, ${branchColor} 0%, ${alpha(theme.palette.primary.main, 0.3)} 50%, transparent 100%)`,
                borderRadius: '0 2px 2px 0',
                boxShadow: isDarkMode
                  ? `0 0 12px ${alpha(theme.palette.primary.main, 0.3)}`
                  : `0 0 8px ${alpha(theme.palette.primary.main, 0.2)}`
              } : {}
            }}
          >
            {node.child.map((childNode, index) => (
              <TreeNode
                key={index}
                node={childNode}
                level={level + 1}
                onEdit={onEdit}
                onDelete={onDelete}
                onAddChild={onAddChild}
              />
            ))}
          </List>
        </Collapse>
      )}
    </>
  );
}

// 领域树组件
function DomainTree({ tags, onEdit, onDelete, onAddChild }) {
  return (
    <List component="nav" aria-label="domain tree">
      {tags.map((node, index) => (
        <TreeNode key={index} node={node} onEdit={onEdit} onDelete={onDelete} onAddChild={onAddChild} />
      ))}
    </List>
  );
}

export default function DomainAnalysis({ projectId, toc = '', loading = false }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentNode, setCurrentNode] = useState(null);
  const [parentNode, setParentNode] = useState('');
  const [dialogMode, setDialogMode] = useState('add');
  const [labelValue, setLabelValue] = useState({});
  const [saving, setSaving] = useState(false);
  const [tags, setTags] = useState([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  useEffect(() => {
    getTags();
  }, []);
  const getTags = async () => {
    const response = await axios.get(`/api/projects/${projectId}/tags`);
    setTags(response.data.tags);
  };
  // 处理标签切换
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // 打开添加标签对话框
  const handleAddTag = () => {
    setDialogMode('add');
    setCurrentNode(null);
    setParentNode(null);
    setLabelValue({});
    setDialogOpen(true);
  };

  // 打开编辑标签对话框
  const handleEditTag = node => {
    setDialogMode('edit');
    setCurrentNode({ id: node.id, label: node.label });
    setLabelValue({ id: node.id, label: node.label });
    setDialogOpen(true);
  };

  // 打开添加子标签对话框
  const handleAddChildTag = parentNode => {
    setDialogMode('addChild');
    setParentNode(parentNode.label);
    setLabelValue({ parentId: parentNode.id });
    setDialogOpen(true);
  };

  // 打开删除标签对话框
  const handleDeleteTag = node => {
    setCurrentNode(node);
    setDeleteDialogOpen(true);
  };

  // 关闭对话框
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setDeleteDialogOpen(false);
  };

  // 查找并更新节点
  const findAndUpdateNode = (nodes, targetNode, newLabel) => {
    return nodes.map(node => {
      if (node === targetNode) {
        return { ...node, label: newLabel };
      }
      if (node.child && node.child.length > 0) {
        return { ...node, child: findAndUpdateNode(node.child, targetNode, newLabel) };
      }
      return node;
    });
  };

  // 查找并删除节点
  const findAndDeleteNode = (nodes, targetNode) => {
    return nodes
      .filter(node => node !== targetNode)
      .map(node => {
        if (node.child && node.child.length > 0) {
          return { ...node, child: findAndDeleteNode(node.child, targetNode) };
        }
        return node;
      });
  };

  // 查找并添加子节点
  const findAndAddChildNode = (nodes, parentNode, childLabel) => {
    return nodes.map(node => {
      if (node === parentNode) {
        const childArray = node.child || [];
        return {
          ...node,
          child: [...childArray, { label: childLabel, child: [] }]
        };
      }
      if (node.child && node.child.length > 0) {
        return { ...node, child: findAndAddChildNode(node.child, parentNode, childLabel) };
      }
      return node;
    });
  };

  // 保存标签更改
  const saveTagChanges = async updatedTags => {
    console.log('保存标签更改:', updatedTags);
    setSaving(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/tags`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ tags: updatedTags })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t('domain.errors.saveFailed'));
      }
      getTags();
      setSnackbar({
        open: true,
        message: t('domain.messages.updateSuccess'),
        severity: 'success'
      });
    } catch (error) {
      console.error('保存标签失败:', error);
      setSnackbar({
        open: true,
        message: error.message || '保存标签失败',
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  // 提交表单
  const handleSubmit = async () => {
    if (!labelValue.label.trim()) {
      setSnackbar({
        open: true,
        message: '标签名称不能为空',
        severity: 'error'
      });
      return;
    }

    await saveTagChanges(labelValue);
    handleCloseDialog();
  };

  const handleConfirmDelete = async () => {
    if (!currentNode) return;

    const res = await axios.delete(`/api/projects/${projectId}/tags?id=${currentNode.id}`);
    if (res.status === 200) {
      toast.success('删除成功');
      getTags();
    }

    setDeleteDialogOpen(false);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (toc.length === 0) {
    return (
      <Paper
        sx={{
          p: 4,
          textAlign: 'center',
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 2
        }}
      >
        <Typography variant="body1" color="textSecondary">
          {t('domain.noToc')}
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      <Paper
        sx={{
          p: 0,
          mb: 3,
          border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(148, 163, 255, 0.24)' : theme.palette.divider}`,
          borderRadius: 2,
          overflow: 'hidden',
          background: theme.palette.mode === 'dark' ? 'rgba(15, 23, 42, 0.75)' : 'rgba(255,255,255,0.9)',
          backdropFilter: theme.palette.mode === 'dark' ? 'blur(12px)' : 'none',
          WebkitBackdropFilter: theme.palette.mode === 'dark' ? 'blur(12px)' : 'none',
        }}
      >
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          indicatorColor="secondary"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            bgcolor:
              theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.8)' : 'rgba(248, 250, 252, 0.8)',
            backdropFilter: theme.palette.mode === 'dark' ? 'blur(10px)' : 'none',
            borderTopLeftRadius: 2,
            borderTopRightRadius: 2
          }}
        >
          <Tab label={t('domain.tabs.tree')} />
          <Tab label={t('domain.tabs.structure')} />
        </Tabs>

        <Box
          sx={{
            p: 3,
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(2, 6, 23, 0.65)' : 'rgba(255, 255, 255, 0.9)',
            borderBottomLeftRadius: 2,
            borderBottomRightRadius: 2,
            boxShadow: theme.palette.mode === 'dark' ? 'inset 0 0 0 1px rgba(148,163,255,0.18)' : 'inset 0 2px 4px rgba(0,0,0,0.03)'
          }}
        >
          <TabPanel value={activeTab} index={0}>
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">{t('domain.tabs.tree')}</Typography>
                <Tooltip title="添加一级标签">
                  <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={handleAddTag}>
                    {t('domain.addRootTag')}
                  </Button>
                </Tooltip>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Box
                sx={{
                  p: 3,
                  bgcolor: theme.palette.mode === 'dark'
                    ? 'rgba(2, 6, 23, 0.65)'
                    : '#FFFFFF', // 白天模式使用纯白背景，确保高对比度
                  border: theme.palette.mode === 'dark'
                    ? '1px solid rgba(148,163,255,0.18)'
                    : `1.5px solid ${alpha(theme.palette.primary.main, 0.2)}`, // 白天模式使用更明显的边框
                  borderRadius: 2,
                  maxHeight: '800px',
                  overflow: 'auto',
                  boxShadow: theme.palette.mode === 'dark'
                    ? 'inset 0 2px 8px rgba(99, 102, 241, 0.1)'
                    : '0 4px 16px rgba(15, 23, 42, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.8)', // 白天模式添加外阴影和内高光
                  position: 'relative',
                  background: theme.palette.mode === 'dark'
                    ? undefined
                    : 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)', // 白天模式使用微妙的渐变
                  '&::-webkit-scrollbar': {
                    width: 10
                  },
                  '&::-webkit-scrollbar-thumb': {
                    backgroundColor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.3 : 0.25),
                    borderRadius: 5,
                    border: theme.palette.mode === 'dark' ? 'none' : '2px solid #FFFFFF'
                  },
                  '&::-webkit-scrollbar-track': {
                    backgroundColor: theme.palette.mode === 'dark' ? 'transparent' : '#F1F5F9',
                    borderRadius: 5
                  }
                }}
              >
                {tags && tags.length > 0 ? (
                  <DomainTree
                    tags={tags}
                    onEdit={handleEditTag}
                    onDelete={handleDeleteTag}
                    onAddChild={handleAddChildTag}
                  />
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      {t('domain.noTags')}
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={handleAddTag}
                      sx={{ mt: 1 }}
                    >
                      {t('domain.addFirstTag')}
                    </Button>
                  </Box>
                )}
              </Box>
            </Box>
          </TabPanel>
          <TabPanel value={activeTab} index={1}>
            <Box>
              <Typography variant="h6" gutterBottom>
                {t('domain.docStructure')}
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box
                sx={{
                  p: 2,
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(2, 6, 23, 0.65)' : theme.palette.background.paper,
                  border: theme.palette.mode === 'dark' ? '1px solid rgba(148,163,255,0.18)' : `1px solid ${theme.palette.divider}`,
                  borderRadius: 1,
                  maxHeight: '600px',
                  overflow: 'auto'
                }}
              >
                <div
                  className="markdown-body"
                  style={
                    theme.palette.mode === 'dark'
                      ? {
                          color: 'rgba(226,232,255,0.9)'
                        }
                      : {}
                  }
                >
                  <ReactMarkdown
                    components={{
                      root: ({ children }) => (
                        <div
                          style={{
                            fontFamily: 'monospace',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word'
                          }}
                        >
                          {children}
                        </div>
                      )
                    }}
                  >
                    {toc}
                  </ReactMarkdown>
                </div>
              </Box>
            </Box>
          </TabPanel>
        </Box>
      </Paper>

      {/* 添加/编辑标签对话框 */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogMode === 'add'
            ? t('domain.dialog.addTitle')
            : dialogMode === 'edit'
              ? t('domain.dialog.editTitle')
              : t('domain.dialog.addChildTitle')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            {dialogMode === 'add'
              ? t('domain.dialog.inputRoot')
              : dialogMode === 'edit'
                ? t('domain.dialog.inputEdit')
                : t('domain.dialog.inputChild', { label: parentNode })}
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label={t('domain.dialog.labelName')}
            type="text"
            fullWidth
            variant="outlined"
            value={labelValue.label}
            onChange={e => setLabelValue({ ...labelValue, label: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>{t('common.cancel')}</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={saving || !labelValue?.label?.trim()}>
            {saving ? t('common.saving') : t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDialog}>
        <DialogTitle>{t('common.confirmDelete')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('domain.dialog.deleteConfirm', { label: currentNode?.label })}
            {currentNode?.child && currentNode.child.length > 0 && t('domain.dialog.deleteWarning')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>{t('common.cancel')}</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            {saving ? t('common.deleting') : t('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
