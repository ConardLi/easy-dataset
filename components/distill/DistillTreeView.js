'use client';

import { useState, useEffect, useCallback, useMemo, forwardRef, useImperativeHandle } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Typography, List } from '@mui/material';
import axios from 'axios';
import { useAtomValue } from 'jotai';
import { selectedModelInfoAtom } from '@/lib/store';
import { useGenerateDataset } from '@/hooks/useGenerateDataset';
import { toast } from 'sonner';
import { alpha, useTheme } from '@mui/material/styles';

// 导入子组件
import TagTreeItem from './TagTreeItem';
import TagMenu from './TagMenu';
import TagEditDialog from './TagEditDialog';
import ConfirmDialog from './ConfirmDialog';
import { sortTagsByNumber } from './utils';

/**
 * 蒸馏树形视图组件
 * @param {Object} props
 * @param {string} props.projectId - 项目ID
 * @param {Array} props.tags - 标签列表
 * @param {Function} props.onGenerateSubTags - 生成子标签的回调函数
 * @param {Function} props.onGenerateQuestions - 生成问题的回调函数
 * @param {Function} props.onTagsUpdate - 标签更新的回调函数
 */
const DistillTreeView = forwardRef(function DistillTreeView(
  { projectId, tags = [], onGenerateSubTags, onGenerateQuestions, onTagsUpdate },
  ref
) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const selectedModel = useAtomValue(selectedModelInfoAtom);
  const [expandedTags, setExpandedTags] = useState({});
  const [tagQuestions, setTagQuestions] = useState({});
  const [loadingTags, setLoadingTags] = useState({});
  const [loadingQuestions, setLoadingQuestions] = useState({});
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedTagForMenu, setSelectedTagForMenu] = useState(null);
  const [allQuestions, setAllQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processingQuestions, setProcessingQuestions] = useState({});
  const [processingMultiTurnQuestions, setProcessingMultiTurnQuestions] = useState({});
  const [deleteQuestionConfirmOpen, setDeleteQuestionConfirmOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [tagToDelete, setTagToDelete] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [tagToEdit, setTagToEdit] = useState(null);
  const [project, setProject] = useState(null);
  const [projectName, setProjectName] = useState('');

  // 使用生成数据集的hook
  const { generateSingleDataset } = useGenerateDataset();

  // 获取问题统计信息
  const fetchQuestionsStats = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/projects/${projectId}/questions/tree?isDistill=true`);
      setAllQuestions(response.data);
      console.log('获取问题统计信息成功:', { totalQuestions: response.data.length });
    } catch (error) {
      console.error('获取问题统计信息失败:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // 暴露方法给父组件
  useImperativeHandle(ref, () => ({
    fetchQuestionsStats
  }));

  // 获取标签下的问题
  const fetchQuestionsByTag = useCallback(
    async tagId => {
      try {
        setLoadingQuestions(prev => ({ ...prev, [tagId]: true }));
        const response = await axios.get(`/api/projects/${projectId}/distill/questions/by-tag?tagId=${tagId}`);
        setTagQuestions(prev => ({
          ...prev,
          [tagId]: response.data
        }));
      } catch (error) {
        console.error('获取标签问题失败:', error);
      } finally {
        setLoadingQuestions(prev => ({ ...prev, [tagId]: false }));
      }
    },
    [projectId]
  );

  // 获取项目信息，获取项目名称
  useEffect(() => {
    if (projectId) {
      axios
        .get(`/api/projects/${projectId}`)
        .then(response => {
          setProject(response.data);
          setProjectName(response.data.name || '');
        })
        .catch(error => {
          console.error('获取项目信息失败:', error);
        });
    }
  }, [projectId]);

  // 初始化时获取问题统计信息
  useEffect(() => {
    fetchQuestionsStats();
  }, [fetchQuestionsStats]);

  // 构建标签树
  const tagTree = useMemo(() => {
    const rootTags = [];
    const tagMap = {};

    // 创建标签映射
    tags.forEach(tag => {
      tagMap[tag.id] = { ...tag, children: [] };
    });

    // 构建树结构
    tags.forEach(tag => {
      if (tag.parentId && tagMap[tag.parentId]) {
        tagMap[tag.parentId].children.push(tagMap[tag.id]);
      } else {
        rootTags.push(tagMap[tag.id]);
      }
    });

    return rootTags;
  }, [tags]);

  // 切换标签展开/折叠状态
  const toggleTag = useCallback(
    tagId => {
      setExpandedTags(prev => ({
        ...prev,
        [tagId]: !prev[tagId]
      }));

      // 如果展开且还没有加载过问题，则加载问题
      if (!expandedTags[tagId] && !tagQuestions[tagId]) {
        fetchQuestionsByTag(tagId);
      }
    },
    [expandedTags, tagQuestions, fetchQuestionsByTag]
  );

  // 处理菜单打开
  const handleMenuOpen = (event, tag) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
    setSelectedTagForMenu(tag);
  };

  // 处理菜单关闭
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedTagForMenu(null);
  };

  // 打开编辑标签对话框
  const openEditDialog = () => {
    setTagToEdit(selectedTagForMenu);
    setEditDialogOpen(true);
    handleMenuClose();
  };

  // 关闭编辑标签对话框
  const closeEditDialog = () => {
    setEditDialogOpen(false);
    setTagToEdit(null);
  };

  // 处理编辑标签成功
  const handleEditTagSuccess = updatedTag => {
    // 更新标签数据，不刷新页面
    const updateTagInTree = tagList => {
      return tagList.map(tag => {
        if (tag.id === updatedTag.id) {
          return { ...tag, label: updatedTag.label };
        }
        if (tag.children && tag.children.length > 0) {
          return { ...tag, children: updateTagInTree(tag.children) };
        }
        return tag;
      });
    };

    // 调用父组件的回调更新标签列表
    const updatedTags = updateTagInTree(tags);
    onTagsUpdate?.(updatedTags);
  };

  // 打开删除确认对话框
  const openDeleteConfirm = () => {
    console.log('打开删除确认对话框', selectedTagForMenu);
    // 保存要删除的标签
    setTagToDelete(selectedTagForMenu);
    setDeleteConfirmOpen(true);
    handleMenuClose();
  };

  // 关闭删除确认对话框
  const closeDeleteConfirm = () => {
    setDeleteConfirmOpen(false);
  };

  // 处理删除标签
  const handleDeleteTag = () => {
    if (!tagToDelete) {
      console.log('没有要删除的标签信息');
      return;
    }

    console.log('开始删除标签:', tagToDelete.id, tagToDelete.label);

    // 先关闭确认对话框
    closeDeleteConfirm();

    // 执行删除操作
    const deleteTagAction = async () => {
      try {
        console.log('发送删除请求:', `/api/projects/${projectId}/tags?id=${tagToDelete.id}`);

        // 发送删除请求
        const response = await axios.delete(`/api/projects/${projectId}/tags?id=${tagToDelete.id}`);

        console.log('删除标签成功:', response.data);

        // 刷新页面
        window.location.reload();
      } catch (error) {
        console.error('删除标签失败:', error);
        console.error('错误详情:', error.response ? error.response.data : '无响应数据');
        alert(`删除标签失败: ${error.message}`);
      }
    };

    // 立即执行删除操作
    deleteTagAction();
  };

  // 打开删除问题确认对话框
  const openDeleteQuestionConfirm = (questionId, event) => {
    event.stopPropagation();
    setQuestionToDelete(questionId);
    setDeleteQuestionConfirmOpen(true);
  };

  // 关闭删除问题确认对话框
  const closeDeleteQuestionConfirm = () => {
    setDeleteQuestionConfirmOpen(false);
    setQuestionToDelete(null);
  };

  // 处理删除问题
  const handleDeleteQuestion = async () => {
    if (!questionToDelete) return;

    try {
      await axios.delete(`/api/projects/${projectId}/questions/${questionToDelete}`);
      // 更新问题列表
      setTagQuestions(prev => {
        const newQuestions = { ...prev };
        Object.keys(newQuestions).forEach(tagId => {
          newQuestions[tagId] = newQuestions[tagId].filter(q => q.id !== questionToDelete);
        });
        return newQuestions;
      });
      // 关闭确认对话框
      closeDeleteQuestionConfirm();
    } catch (error) {
      console.error('删除问题失败:', error);
    }
  };

  // 处理生成数据集
  const handleGenerateDataset = async (questionId, questionInfo, event) => {
    event.stopPropagation();
    // 设置处理状态
    setProcessingQuestions(prev => ({
      ...prev,
      [questionId]: true
    }));
    await generateSingleDataset({ projectId, questionId, questionInfo });
    // 重置处理状态
    setProcessingQuestions(prev => ({
      ...prev,
      [questionId]: false
    }));
  };

  // 处理生成多轮对话数据集
  const handleGenerateMultiTurnDataset = async (questionId, questionInfo, event) => {
    event.stopPropagation();

    try {
      // 设置处理状态
      setProcessingMultiTurnQuestions(prev => ({
        ...prev,
        [questionId]: true
      }));

      // 首先检查项目是否配置了多轮对话设置
      const configResponse = await axios.get(`/api/projects/${projectId}/tasks`);
      if (configResponse.status !== 200) {
        throw new Error('获取项目配置失败');
      }

      const config = configResponse.data;
      const multiTurnConfig = {
        systemPrompt: config.multiTurnSystemPrompt,
        scenario: config.multiTurnScenario,
        rounds: config.multiTurnRounds,
        roleA: config.multiTurnRoleA,
        roleB: config.multiTurnRoleB
      };

      // 检查是否已配置必要的多轮对话设置
      if (
        !multiTurnConfig.scenario ||
        !multiTurnConfig.roleA ||
        !multiTurnConfig.roleB ||
        !multiTurnConfig.rounds ||
        multiTurnConfig.rounds < 1
      ) {
        throw new Error('请先在项目设置中配置多轮对话相关参数');
      }

      // 检查是否选择了模型
      if (!selectedModel || Object.keys(selectedModel).length === 0) {
        throw new Error('请先选择一个模型');
      }

      // 调用多轮对话生成API
      const response = await axios.post(`/api/projects/${projectId}/dataset-conversations`, {
        questionId,
        ...multiTurnConfig,
        model: selectedModel,
        language: 'zh-CN'
      });

      if (response.status === 200) {
        // 成功后刷新问题统计
        fetchQuestionsStats();
        toast.success(t('datasets.multiTurnGenerateSuccess', { defaultValue: '多轮对话数据集生成成功！' }));

        // 通知父组件刷新统计信息
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('refreshDistillStats'));
        }
      }
    } catch (error) {
      console.error('生成多轮对话数据集失败:', error);
      toast.error(error.message || t('datasets.multiTurnGenerateError', { defaultValue: '生成多轮对话数据集失败' }));
    } finally {
      // 重置处理状态
      setProcessingMultiTurnQuestions(prev => ({
        ...prev,
        [questionId]: false
      }));
    }
  };

  // 获取标签路径
  const getTagPath = useCallback(
    tag => {
      if (!tag) return '';

      const findPath = (currentTag, path = []) => {
        const newPath = [currentTag.label, ...path];

        if (!currentTag.parentId) {
          // 如果是顶级标签，确保路径以项目名称开始
          if (projectName && !newPath.includes(projectName)) {
            return [projectName, ...newPath];
          }
          return newPath;
        }

        const parentTag = tags.find(t => t.id === currentTag.parentId);
        if (!parentTag) {
          // 如果没有找到父标签，确保路径以项目名称开始
          if (projectName && !newPath.includes(projectName)) {
            return [projectName, ...newPath];
          }
          return newPath;
        }

        return findPath(parentTag, newPath);
      };

      const path = findPath(tag);

      // 最终检查，确保路径以项目名称开始
      if (projectName && path.length > 0 && path[0] !== projectName) {
        path.unshift(projectName);
      }

      return path.join(' > ');
    },
    [tags, projectName]
  );

  // 渲染标签树
  const renderTagTree = (tagList, level = 0) => {
    // 对同级标签进行排序
    const sortedTagList = sortTagsByNumber(tagList);
    const treeContainerBg = alpha(theme.palette.background.paper, isDark ? 0.16 : 0.06);
    const treeContainerBorder = alpha(theme.palette.primary.main, isDark ? 0.24 : 0.12);

    return (
      <List
        disablePadding
        sx={{
          px: 2,
          py: 1,
          borderRadius: 2,
          backgroundColor: treeContainerBg,
          border: `1px solid ${treeContainerBorder}`,
          '& + &': {
            mt: 1.5
          }
        }}
      >
        {sortedTagList.map(tag => (
          <TagTreeItem
            key={tag.id}
            tag={tag}
            level={level}
            expanded={expandedTags[tag.id]}
            onToggle={toggleTag}
            onMenuOpen={handleMenuOpen}
            onGenerateQuestions={tag => {
              // 包装函数，处理问题生成后的刷新
              const handleGenerateQuestionsWithRefresh = async () => {
                // 调用父组件传入的函数生成问题
                await onGenerateQuestions(tag, getTagPath(tag));

                // 生成问题后刷新数据
                await fetchQuestionsStats();

                // 如果标签已展开，刷新该标签的问题详情
                if (expandedTags[tag.id]) {
                  await fetchQuestionsByTag(tag.id);
                }
              };

              handleGenerateQuestionsWithRefresh();
            }}
            onGenerateSubTags={tag => onGenerateSubTags(tag, getTagPath(tag))}
            questions={tagQuestions[tag.id] || []}
            loadingQuestions={loadingQuestions[tag.id]}
            processingQuestions={processingQuestions}
            processingMultiTurnQuestions={processingMultiTurnQuestions}
            onDeleteQuestion={openDeleteQuestionConfirm}
            onGenerateDataset={handleGenerateDataset}
            onGenerateMultiTurnDataset={handleGenerateMultiTurnDataset}
            allQuestions={allQuestions}
            tagQuestions={tagQuestions}
          >
            {/* 递归渲染子标签 */}
            {tag.children && tag.children.length > 0 && expandedTags[tag.id] && renderTagTree(tag.children, level + 1)}
          </TagTreeItem>
        ))}
      </List>
    );
  };

  return (
    <Box>
      {tagTree.length > 0 ? (
        renderTagTree(tagTree)
      ) : (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            {t('distill.noTags')}
          </Typography>
        </Box>
      )}

      {/* 标签操作菜单 */}
      <TagMenu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
        onEdit={openEditDialog}
        onDelete={openDeleteConfirm}
      />

      {/* 编辑标签对话框 */}
      <TagEditDialog
        open={editDialogOpen}
        tag={tagToEdit}
        projectId={projectId}
        onClose={closeEditDialog}
        onSuccess={handleEditTagSuccess}
      />

      {/* 删除标签确认对话框 */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onClose={closeDeleteConfirm}
        onConfirm={handleDeleteTag}
        title={t('distill.deleteTagConfirmTitle')}
        cancelText={t('common.cancel')}
        confirmText={t('common.delete')}
        confirmColor="error"
      />

      {/* 删除问题确认对话框 */}
      <ConfirmDialog
        open={deleteQuestionConfirmOpen}
        onClose={closeDeleteQuestionConfirm}
        onConfirm={handleDeleteQuestion}
        title={t('questions.deleteConfirm')}
        cancelText={t('common.cancel')}
        confirmText={t('common.delete')}
        confirmColor="error"
      />
    </Box>
  );
});

export default DistillTreeView;
