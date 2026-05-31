'use client';

import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import axios from 'axios';

const useDatasetExport = projectId => {
  const { t } = useTranslation();

  // 优化的流式导出 - 使用 WritableStream 避免内存溢出
  const exportDatasetsStreaming = async (exportOptions, onProgress) => {
    try {
      const batchSize = exportOptions.batchSize || 1000;
      let offset = 0;
      let hasMore = true;
      let totalProcessed = 0;
      let isFirstBatch = true;

      // 确定文件格式
      const fileFormat = exportOptions.fileFormat || 'json';
      const formatType = exportOptions.formatType || 'alpaca';

      // 生成文件名
      const formatSuffixMap = {
        alpaca: 'alpaca',
        multilingualthinking: 'multilingual-thinking',
        sharegpt: 'sharegpt',
        custom: 'custom'
      };
      const formatSuffix = formatSuffixMap[formatType] || formatType || 'export';
      const balanceSuffix = exportOptions.balanceMode ? '-balanced' : '';
      const dateStr = new Date().toISOString().slice(0, 10);
      const fileName = `datasets-${projectId}-${formatSuffix}${balanceSuffix}-${dateStr}.${fileFormat}`;

      // 创建可写流
      let fileStream;
      let writer;

      try {
        // 使用 showSaveFilePicker API（现代浏览器）
        if (window.showSaveFilePicker) {
          const handle = await window.showSaveFilePicker({
            suggestedName: fileName,
            types: [
              {
                description: 'Dataset File',
                accept: {
                  'application/json': [`.${fileFormat}`]
                }
              }
            ]
          });
          fileStream = await handle.createWritable();
        } else {
          // 降级方案：使用内存缓冲区（但分块处理）
          fileStream = null;
        }
      } catch (err) {
        if (err?.name === 'AbortError') {
          return false;
        }

        // 不支持文件系统 API 时，使用降级方案
        fileStream = null;
      }

      // 如果不支持流式写入，使用分块累积方案
      let chunks = [];
      let chunkCount = 0;
      const MAX_CHUNKS_IN_MEMORY = 5; // 最多在内存中保留5批数据

      // 写入文件头（JSON数组开始或CSV表头）
      if (fileFormat === 'json') {
        if (fileStream) {
          await fileStream.write('[\n');
        } else {
          chunks.push('[\n');
        }
      } else if (fileFormat === 'csv') {
        // 写入CSV表头
        const headers = getCSVHeaders(formatType, exportOptions);
        const headerLine = headers.join(',') + '\n';
        if (fileStream) {
          await fileStream.write(headerLine);
        } else {
          chunks.push(headerLine);
        }
      }

      // 分批获取和写入数据
      while (hasMore) {
        const apiUrl = `/api/projects/${projectId}/datasets/export`;
        const requestBody = {
          batchMode: true,
          offset: offset,
          batchSize: batchSize
        };

        // 如果有选中的数据集 ID，传递 ID 列表
        if (exportOptions.selectedIds && exportOptions.selectedIds.length > 0) {
          requestBody.selectedIds = exportOptions.selectedIds;
        } else if (exportOptions.confirmedOnly) {
          requestBody.status = 'confirmed';
        }

        // 检查是否是平衡导出模式
        if (exportOptions.balanceMode && exportOptions.balanceConfig) {
          requestBody.balanceMode = true;
          requestBody.balanceConfig = exportOptions.balanceConfig;
        }

        const response = await axios.post(apiUrl, requestBody);
        const batchResult = response.data;

        // 如果需要包含文本块内容，批量查询并填充
        if (exportOptions.customFields?.includeChunk && batchResult.data.length > 0) {
          const chunkNames = batchResult.data.map(item => item.chunkName).filter(name => name);

          if (chunkNames.length > 0) {
            try {
              const chunkResponse = await axios.post(`/api/projects/${projectId}/chunks/batch-content`, {
                chunkNames
              });
              const chunkContentMap = chunkResponse.data;

              batchResult.data.forEach(item => {
                if (item.chunkName && chunkContentMap[item.chunkName]) {
                  item.chunkContent = chunkContentMap[item.chunkName];
                }
              });
            } catch (chunkError) {
              console.error('获取文本块内容失败:', chunkError);
            }
          }
        }

        // 转换当前批次数据
        const formattedBatch = formatDataBatch(batchResult.data, exportOptions);

        // 写入当前批次
        if (fileFormat === 'json') {
          // 保持与原逻辑一致：JSON 导出为“格式化后的 JSON 数组”（2空格缩进）
          // 每条记录单独 stringify + 缩进，并在数组级别拼接，避免一次性 stringify 全量数据导致内存暴涨
          const batchContent = formattedBatch
            .map(item => {
              const pretty = JSON.stringify(item, null, 2);
              // 将对象的每一行整体再缩进 2 个空格，以符合数组元素缩进
              return '  ' + pretty.replace(/\n/g, '\n  ');
            })
            .join(',\n');

          const content = isFirstBatch ? batchContent : ',\n' + batchContent;

          if (fileStream) {
            await fileStream.write(content);
          } else {
            chunks.push(content);
            chunkCount++;
          }
        } else if (fileFormat === 'jsonl') {
          const batchContent = formattedBatch.map(item => JSON.stringify(item)).join('\n') + '\n';

          if (fileStream) {
            await fileStream.write(batchContent);
          } else {
            chunks.push(batchContent);
            chunkCount++;
          }
        } else if (fileFormat === 'csv') {
          const batchContent = formatBatchToCSV(formattedBatch, formatType, exportOptions);

          if (fileStream) {
            await fileStream.write(batchContent);
          } else {
            chunks.push(batchContent);
            chunkCount++;
          }
        }

        // 如果使用内存缓冲且累积了足够多的块，触发部分下载
        if (!fileStream && chunkCount >= MAX_CHUNKS_IN_MEMORY) {
          // 这里我们仍然需要等到最后才能下载，但至少限制了内存使用
          // 可以考虑使用 Blob 分片
        }

        hasMore = batchResult.hasMore;
        offset = batchResult.offset;
        totalProcessed += batchResult.data.length;
        isFirstBatch = false;

        // 通知进度更新
        if (onProgress) {
          onProgress({
            processed: totalProcessed,
            currentBatch: batchResult.data.length,
            hasMore
          });
        }

        // 避免过快请求
        if (hasMore) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }

      // 写入文件尾
      if (fileFormat === 'json') {
        if (fileStream) {
          await fileStream.write('\n]\n');
          await fileStream.close();
        } else {
          chunks.push('\n]\n');
        }
      } else {
        if (fileStream) {
          await fileStream.close();
        }
      }

      // 如果使用内存缓冲方案，现在触发下载
      if (!fileStream) {
        downloadFromChunks(chunks, fileName);
      }

      toast.success(t('datasets.exportSuccess'));
      return true;
    } catch (error) {
      console.error('Streaming export failed:', error);
      toast.error(error.message || t('datasets.exportFailed'));
      return false;
    }
  };

  // 从内存块下载文件（优化版本，使用 Blob 流）
  const downloadFromChunks = (chunks, fileName) => {
    // 使用 Blob 构造函数，它会自动处理大数据
    const blob = new Blob(chunks, { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // 延迟释放 URL，确保下载开始
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  // 获取CSV表头
  const getCSVHeaders = (formatType, exportOptions) => {
    if (formatType === 'alpaca') {
      return ['instruction', 'input', 'output', 'system'];
    } else if (formatType === 'sharegpt') {
      return ['messages'];
    } else if (formatType === 'multilingualthinking') {
      return ['reasoning_language', 'developer', 'user', 'analysis', 'final', 'messages'];
    } else if (formatType === 'custom') {
      const { questionField, answerField, cotField, includeLabels, includeChunk, questionOnly } =
        exportOptions.customFields;
      const headers = ['_easyDatasetId', '_easyDatasetQuestionId', questionField];
      if (!questionOnly) {
        headers.push(answerField);
        if (exportOptions.includeCOT && cotField) {
          headers.push(cotField);
        }
      }
      if (includeLabels) headers.push('label');
      if (includeChunk) headers.push('chunk');
      return headers;
    }
    return [];
  };

  // 格式化数据批次
  const formatDataBatch = (dataBatch, exportOptions) => {
    const formatType = exportOptions.formatType || 'alpaca';

    if (formatType === 'alpaca') {
      if (exportOptions.alpacaFieldType === 'instruction') {
        return dataBatch.map(({ question, answer, cot }) => ({
          instruction: question,
          input: '',
          output: cot && exportOptions.includeCOT ? `<think>${cot}</think>\n${answer}` : answer,
          system: exportOptions.systemPrompt || ''
        }));
      } else {
        return dataBatch.map(({ question, answer, cot }) => ({
          instruction: exportOptions.customInstruction || '',
          input: question,
          output: cot && exportOptions.includeCOT ? `<think>${cot}</think>\n${answer}` : answer,
          system: exportOptions.systemPrompt || ''
        }));
      }
    } else if (formatType === 'sharegpt') {
      return dataBatch.map(({ question, answer, cot }) => {
        const messages = [];
        if (exportOptions.systemPrompt) {
          messages.push({ role: 'system', content: exportOptions.systemPrompt });
        }
        messages.push({
          role: 'user',
          content: question
        });
        messages.push({
          role: 'assistant',
          content: cot && exportOptions.includeCOT ? `<think>${cot}</think>\n${answer}` : answer
        });
        return { messages };
      });
    } else if (formatType === 'multilingualthinking') {
      return dataBatch.map(({ question, answer, cot }) => ({
        reasoning_language: exportOptions.reasoningLanguage || 'English',
        developer: exportOptions.systemPrompt || '',
        user: question,
        analysis: exportOptions.includeCOT && cot ? cot : null,
        final: answer,
        messages: [
          {
            content: exportOptions.systemPrompt || '',
            role: 'system',
            thinking: null
          },
          {
            content: question,
            role: 'user',
            thinking: null
          },
          {
            content: answer,
            role: 'assistant',
            thinking: exportOptions.includeCOT && cot ? cot : null
          }
        ]
      }));
    } else if (formatType === 'custom') {
      const { questionField, answerField, cotField, includeLabels, includeChunk, questionOnly } =
        exportOptions.customFields;
      return dataBatch.map(({ id, questionId, question, answer, cot, questionLabel: labels, chunkContent }) => {
        const item = {
          _easyDatasetId: id,
          _easyDatasetQuestionId: questionId,
          [questionField]: question
        };
        if (!questionOnly) {
          item[answerField] = answer;
          if (cot && exportOptions.includeCOT && cotField) {
            item[cotField] = cot;
          }
        }
        if (includeLabels && labels && labels.length > 0) {
          item.label = labels.split(' ')[1];
        }
        if (includeChunk && chunkContent) {
          item.chunk = chunkContent;
        }
        return item;
      });
    }
    return dataBatch;
  };

  // 将批次格式化为CSV行
  const formatBatchToCSV = (formattedBatch, formatType, exportOptions) => {
    const headers = getCSVHeaders(formatType, exportOptions);
    return (
      formattedBatch
        .map(item => {
          return headers
            .map(header => {
              let field = item[header]?.toString() || '';
              // 对于复杂对象，转换为JSON字符串
              if (typeof item[header] === 'object') {
                field = JSON.stringify(item[header]);
              }
              // CSV转义
              if (field.includes(',') || field.includes('\n') || field.includes('"')) {
                field = `"${field.replace(/"/g, '""')}"`;
              }
              return field;
            })
            .join(',');
        })
        .join('\n') + '\n'
    );
  };

  // 处理和下载数据的通用函数（保留用于小数据量）
  const processAndDownloadData = async (dataToExport, exportOptions) => {
    const formattedData = formatDataBatch(dataToExport, exportOptions);

    let content;
    let fileExtension;
    const fileFormat = exportOptions.fileFormat || 'json';

    if (fileFormat === 'jsonl') {
      content = formattedData.map(item => JSON.stringify(item)).join('\n');
      fileExtension = 'jsonl';
    } else if (fileFormat === 'csv') {
      const headers = getCSVHeaders(exportOptions.formatType, exportOptions);
      const csvRows = [
        headers.join(','),
        ...formattedData.map(item =>
          headers
            .map(header => {
              let field = item[header]?.toString() || '';
              if (typeof item[header] === 'object') {
                field = JSON.stringify(item[header]);
              }
              if (field.includes(',') || field.includes('\n') || field.includes('"')) {
                field = `"${field.replace(/"/g, '""')}"`;
              }
              return field;
            })
            .join(',')
        )
      ];
      content = csvRows.join('\n');
      fileExtension = 'csv';
    } else {
      content = JSON.stringify(formattedData, null, 2);
      fileExtension = 'json';
    }

    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;

    const formatSuffixMap = {
      alpaca: 'alpaca',
      multilingualthinking: 'multilingual-thinking',
      sharegpt: 'sharegpt',
      custom: 'custom'
    };
    const formatSuffix = formatSuffixMap[exportOptions.formatType] || exportOptions.formatType || 'export';
    const balanceSuffix = exportOptions.balanceMode ? '-balanced' : '';
    const dateStr = new Date().toISOString().slice(0, 10);
    a.download = `datasets-${projectId}-${formatSuffix}${balanceSuffix}-${dateStr}.${fileExtension}`;

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 导出数据集（保持向后兼容的原有功能）
  const exportDatasets = async exportOptions => {
    try {
      const apiUrl = `/api/projects/${projectId}/datasets/export`;
      const requestBody = {};

      if (exportOptions.selectedIds && exportOptions.selectedIds.length > 0) {
        requestBody.selectedIds = exportOptions.selectedIds;
      } else if (exportOptions.confirmedOnly) {
        requestBody.status = 'confirmed';
      }

      if (exportOptions.balanceMode && exportOptions.balanceConfig) {
        requestBody.balanceMode = true;
        requestBody.balanceConfig = exportOptions.balanceConfig;
      }

      const response = await axios.post(apiUrl, requestBody);
      let dataToExport = response.data;

      await processAndDownloadData(dataToExport, exportOptions);

      toast.success(t('datasets.exportSuccess'));
      return true;
    } catch (error) {
      toast.error(error.message);
      return false;
    }
  };

  // 导出平衡数据集
  const exportBalancedDataset = async exportOptions => {
    const balancedOptions = {
      ...exportOptions,
      balanceMode: true,
      balanceConfig: exportOptions.balanceConfig
    };
    return await exportDatasets(balancedOptions);
  };

  return {
    exportDatasets,
    exportBalancedDataset,
    exportDatasetsStreaming
  };
};

export default useDatasetExport;
export { useDatasetExport };
