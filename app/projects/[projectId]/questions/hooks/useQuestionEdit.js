'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import request from '@/lib/util/request';

export function useQuestionEdit(projectId, onSuccess) {
  const { t } = useTranslation();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState('create');
  const [editingQuestion, setEditingQuestion] = useState(null);

  const handleOpenCreateDialog = () => {
    setEditMode('create');
    setEditingQuestion(null);
    setEditDialogOpen(true);
  };

  const handleOpenEditDialog = question => {
    setEditMode('edit');
    setEditingQuestion(question);
    setEditDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setEditDialogOpen(false);
    setEditingQuestion(null);
  };

  const handleSubmitQuestion = async formData => {
    try {
      const response = await request(`/api/projects/${projectId}/questions`, {
        method: editMode === 'create' ? 'POST' : 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(
          editMode === 'create'
            ? {
                question: formData.question,
                chunkId: formData.chunkId,
                label: formData.label
              }
            : {
                question: formData.question,
                oldQuestion: editingQuestion.question,
                chunkId: formData.chunkId,
                label: formData.label,
                oldChunkId: editingQuestion.chunkId
              }
        )
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t('questions.operationFailed'));
      }

      // 获取更新后的问题数据
      const updatedQuestion = await response.json();

      // 直接更新问题列表中的数据，而不是重新获取整个列表
      if (onSuccess) {
        onSuccess(updatedQuestion);
      }
      handleCloseDialog();
    } catch (error) {
      console.error('操作失败:', error);
    }
  };

  return {
    editDialogOpen,
    editMode,
    editingQuestion,
    handleOpenCreateDialog,
    handleOpenEditDialog,
    handleCloseDialog,
    handleSubmitQuestion
  };
}
