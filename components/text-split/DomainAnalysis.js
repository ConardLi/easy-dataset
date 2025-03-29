'use client';

import { useState } from 'react';
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
  ListItem,
  ListItemText,
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
import { useTheme } from '@mui/material/styles';
import TabPanel from './components/TabPanel';
import ReactMarkdown from 'react-markdown';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertIcon from '@mui/icons-material/MoreVert';

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

  return (
    <>
      <ListItem
        button
        onClick={handleClick}
        sx={{
          pl: level * 2 + 1,
          bgcolor: level === 0 ? theme.palette.primary.light : 'transparent',
          color: level === 0 ? theme.palette.primary.contrastText : 'inherit',
          '&:hover': {
            bgcolor: level === 0 ? theme.palette.primary.main : theme.palette.action.hover
          },
          borderRadius: '4px',
          mb: 0.5,
          pr: 1
        }}
      >
        <ListItemText
          primary={node.label}
          primaryTypographyProps={{
            fontWeight: level === 0 ? 600 : 400,
            fontSize: level === 0 ? '1rem' : '0.9rem'
          }}
        />
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton
            size="small"
            onClick={handleMenuOpen}
            sx={{
              color: level === 0 ? 'inherit' : theme.palette.text.secondary,
              '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' }
            }}
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
          {hasChildren && (open ? <ExpandLess /> : <ExpandMore />)}
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
      </ListItem>

      {hasChildren && (
        <Collapse in={open} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
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

export default function DomainAnalysis({ projectId, toc = '', tags = [], loading = false, onTagsUpdate }) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(0);
  const [editingTags, setEditingTags] = useState([...tags]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentNode, setCurrentNode] = useState(null);
  const [parentNode, setParentNode] = useState(null);
  const [dialogMode, setDialogMode] = useState('add');
  const [labelValue, setLabelValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
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
    setLabelValue('');
    setDialogOpen(true);
  };

  // 打开编辑标签对话框
  const handleEditTag = node => {
    setDialogMode('edit');
    setCurrentNode(node);
    setLabelValue(node.label);
    setDialogOpen(true);
  };

  // 打开添加子标签对话框
  const handleAddChildTag = parentNode => {
    setDialogMode('addChild');
    setParentNode(parentNode);
    setLabelValue('');
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

      const data = await response.json();
      setEditingTags(data.tags);
      if (onTagsUpdate) {
        onTagsUpdate(data.tags);
      }
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
    if (!labelValue.trim()) {
      setSnackbar({
        open: true,
        message: '标签名称不能为空',
        severity: 'error'
      });
      return;
    }

    let updatedTags = [...editingTags];

    if (dialogMode === 'add') {
      updatedTags = [...updatedTags, { label: labelValue, child: [] }];
    } else if (dialogMode === 'edit' && currentNode) {
      updatedTags = findAndUpdateNode(updatedTags, currentNode, labelValue);
    } else if (dialogMode === 'addChild' && parentNode) {
      updatedTags = findAndAddChildNode(updatedTags, parentNode, labelValue);
    }

    await saveTagChanges(updatedTags);
    handleCloseDialog();
  };

  const handleConfirmDelete = async () => {
    if (!currentNode) return;

    const updatedTags = findAndDeleteNode(editingTags, currentNode);
    await saveTagChanges(updatedTags);
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
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 2,
          overflow: 'hidden'
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
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
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
            bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.8)',
            borderBottomLeftRadius: 2,
            borderBottomRightRadius: 2,
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.03)'
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
                  p: 2,
                  bgcolor: theme.palette.background.paper,
                  borderRadius: 1,
                  maxHeight: '800px',
                  overflow: 'auto'
                }}
              >
                {editingTags && editingTags.length > 0 ? (
                  <DomainTree
                    tags={editingTags}
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
                  bgcolor: theme.palette.background.paper,
                  borderRadius: 1,
                  maxHeight: '600px',
                  overflow: 'auto'
                }}
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
                : t('domain.dialog.inputChild', { label: parentNode?.label })}
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label={t('domain.dialog.labelName')}
            type="text"
            fullWidth
            variant="outlined"
            value={labelValue}
            onChange={e => setLabelValue(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>{t('common.cancel')}</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={saving || !labelValue.trim()}>
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
