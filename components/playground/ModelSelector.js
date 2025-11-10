import React from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Box,
  Chip,
  Checkbox,
  ListItemText,
  alpha
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250
    }
  }
};

/**
 * 模型选择组件
 * @param {Object} props
 * @param {Array} props.models - 可用模型列表
 * @param {Array} props.selectedModels - 已选择的模型ID列表
 * @param {Function} props.onChange - 选择改变时的回调函数
 */
export default function ModelSelector({ models, selectedModels, onChange }) {
  // 获取模型名称
  const getModelName = modelId => {
    const model = models.find(m => m.id === modelId);
    return model ? `${model.providerName}: ${model.modelName}` : modelId;
  };
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <FormControl fullWidth>
      <InputLabel id="model-select-label">{t('playground.selectModelMax3')}</InputLabel>
      <Select
        labelId="model-select-label"
        id="model-select"
        multiple
        value={selectedModels}
        onChange={onChange}
        input={<OutlinedInput label="选择模型（最多3个）" />}
        renderValue={selected => (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {selected.map(modelId => (
              <Chip
                key={modelId}
                label={getModelName(modelId)}
                color="primary"
                variant="outlined"
                size="small"
                sx={{
                  backgroundColor: isDark
                    ? alpha(theme.palette.primary.main, 0.15)
                    : alpha(theme.palette.primary.main, 0.1),
                  borderColor: isDark
                    ? alpha(theme.palette.primary.main, 0.35)
                    : alpha(theme.palette.primary.main, 0.3),
                  color: isDark
                    ? theme.palette.primary.light
                    : theme.palette.primary.dark,
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: isDark
                      ? alpha(theme.palette.primary.main, 0.25)
                      : alpha(theme.palette.primary.main, 0.15),
                    borderColor: isDark
                      ? alpha(theme.palette.primary.main, 0.5)
                      : alpha(theme.palette.primary.main, 0.4),
                    transform: 'translateY(-1px)',
                    boxShadow: isDark
                      ? `0 2px 8px ${alpha(theme.palette.primary.main, 0.2)}`
                      : `0 2px 8px ${alpha(theme.palette.primary.main, 0.15)}`
                  }
                }}
              />
            ))}
          </Box>
        )}
        MenuProps={MenuProps}
      >
        {models
          .filter(m => {
            if (m.providerId.toLowerCase() === 'ollama') {
              return m.modelName && m.endpoint;
            } else {
              return m.modelName && m.endpoint && m.apiKey;
            }
          })
          .map(model => (
            <MenuItem
              key={model.id}
              value={model.id}
              disabled={selectedModels.length >= 3 && !selectedModels.includes(model.id)}
            >
              <Checkbox checked={selectedModels.indexOf(model.id) > -1} />
              <ListItemText primary={`${model.providerName}: ${model.modelName}`} />
            </MenuItem>
          ))}
      </Select>
    </FormControl>
  );
}
