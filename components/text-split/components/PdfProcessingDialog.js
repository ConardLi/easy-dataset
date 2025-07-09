'use client';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  Card,
  CardContent,
  Typography,
  Box,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { styled } from '@mui/material/styles';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined';
import LaunchOutlinedIcon from '@mui/icons-material/LaunchOutlined';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import ChangeCircleOutlinedIcon from '@mui/icons-material/ChangeCircleOutlined';

const StyledCard = styled(Card)(({ theme, disabled }) => ({
  cursor: disabled ? 'not-allowed' : 'pointer',
  opacity: disabled ? 0.6 : 1,
  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
  '&:hover': disabled
    ? {}
    : {
        transform: 'translateY(-4px)',
        boxShadow: theme.shadows[4]
      }
}));

const OptionCard = ({
  icon,
  title,
  description,
  disabled,
  onClick,
  selected,
  isVisionEnabled,
  visionModels,
  selectorName,
  handleSettingChange,
  selectedViosnModel
}) => (
  <StyledCard
    disabled={disabled}
    onClick={disabled ? undefined : onClick}
    sx={{
      height: '100%',
      border: selected ? '2px solid primary.main' : '1px solid divider',
      backgroundColor: selected ? 'action.selected' : 'background.paper'
    }}
  >
    <CardContent>
      <Stack spacing={1}>
        <Box sx={{ color: 'primary.main', mb: 1 }}>{icon}</Box>
        <Typography variant="h6" component="div">
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
        {isVisionEnabled && (
          <FormControl fullWidth>
            <InputLabel>{selectorName}</InputLabel>
            <Select
              label={selectorName}
              value={selectedViosnModel}
              onChange={e => handleSettingChange(e)}
              name="vision"
            >
              {visionModels.map(item => (
                <MenuItem key={item.id} value={item.id}>
                  {item.modelName} ({item.providerName})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Stack>
    </CardContent>
  </StyledCard>
);

export default function PdfProcessingDialog({
  open,
  onClose,
  onRadioChange,
  value,
  taskSettings,
  visionModels,
  selectedViosnModel,
  setSelectedViosnModel
}) {
  const { t } = useTranslation();

  //检查配置中是否启用MinerU
  const isMinerUEnabled = taskSettings && taskSettings.minerUToken ? true : false;

  const isMinerULocalEnabled = taskSettings && taskSettings.minerULocalUrl ? true : false;

  //检查配置中是否启用Vision策略
  const isVisionEnabled = visionModels.length > 0 ? true : false;

  //用于传递到父组件，显示当前选中的模型
  let selectedModel = selectedViosnModel;

  const handleOptionClick = optionValue => {
    if (optionValue === 'mineru-web') {
      window.open('https://mineru.net/OpenSourceTools/Extractor', '_blank');
    } else {
      onRadioChange({ target: { value: optionValue, selectedVision: selectedModel } });
      onClose();
    }
  };

  // 处理设置变更
  const handleSettingChange = e => {
    const { value } = e.target;
    selectedModel = value;
    setSelectedViosnModel(value);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{t('textSplit.pdfProcess')}</DialogTitle>
      <DialogContent>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 2,
            p: 1
          }}
        >
          <OptionCard
            icon={<ArticleOutlinedIcon fontSize="large" />}
            title={t('textSplit.basicPdfParsing')}
            description={t('textSplit.basicPdfParsingDesc')}
            onClick={() => handleOptionClick('default')}
            selected={value === 'default'}
          />
          <OptionCard
            icon={<ScienceOutlinedIcon fontSize="large" />}
            title="MinerU API"
            description={isMinerUEnabled ? t('textSplit.mineruApiDesc') : t('textSplit.mineruApiDescDisabled')}
            disabled={!isMinerUEnabled}
            onClick={() => handleOptionClick('mineru')}
            selected={value === 'mineru'}
          />
          <OptionCard
            icon={<ChangeCircleOutlinedIcon fontSize="large" />}
            title="MinerU Local"
            description={isMinerULocalEnabled ? t('textSplit.mineruLocalDesc') : t('textSplit.mineruLocalDisabled')}
            disabled={!isMinerULocalEnabled}
            onClick={() => handleOptionClick('mineru-local')}
            selected={value === 'mineru-local'}
          />
          <OptionCard
            icon={<LaunchOutlinedIcon fontSize="large" />}
            title={t('textSplit.mineruWebPlatform')}
            description={t('textSplit.mineruWebPlatformDesc')}
            onClick={() => handleOptionClick('mineru-web')}
          />
          <OptionCard
            icon={<SmartToyOutlinedIcon fontSize="large" />}
            title={t('textSplit.customVisionModel')}
            description={t('textSplit.customVisionModelDesc')}
            disabled={!isVisionEnabled}
            onClick={() => handleOptionClick('vision')}
            selected={value === 'vision'}
            isVisionEnabled={isVisionEnabled}
            visionModels={visionModels}
            selectorName={t('settings.vision')}
            selectedViosnModel={selectedViosnModel}
            handleSettingChange={handleSettingChange}
          />
        </Box>
      </DialogContent>
    </Dialog>
  );
}
