'use client';

import { Dialog, DialogTitle, DialogContent, DialogContentText, Card, CardContent, Typography, Box, Stack } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { styled } from '@mui/material/styles';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined';
import LaunchOutlinedIcon from '@mui/icons-material/LaunchOutlined';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';

const StyledCard = styled(Card)(({ theme, disabled }) => ({
  cursor: disabled ? 'not-allowed' : 'pointer',
  opacity: disabled ? 0.6 : 1,
  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
  '&:hover': disabled ? {} : {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[4],
  },
}));

const OptionCard = ({ icon, title, description, disabled, onClick, selected }) => (
  <StyledCard
    disabled={disabled}
    onClick={disabled ? undefined : onClick}
    sx={{
      height: '100%',
      border: selected ? '2px solid primary.main' : '1px solid divider',
      backgroundColor: selected ? 'action.selected' : 'background.paper',
    }}
  >
    <CardContent>
      <Stack spacing={1}>
        <Box sx={{ color: 'primary.main', mb: 1 }}>
          {icon}
        </Box>
        <Typography variant="h6" component="div">
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </Stack>
    </CardContent>
  </StyledCard>
);

export default function PdfProcessingDialog({
  open,
  onClose,
  onRadioChange,
  value,
  projectId,
  taskSettings
}) {
  const { t } = useTranslation();
  const isMinerUEnabled = (taskSettings&&taskSettings.minerUToken)?true:false;
  const isVisionEnabled = (taskSettings&&taskSettings.vision)?true:false;

  const handleOptionClick = (optionValue) => {
    if (optionValue === 'mineru-web') {
      window.open('https://mineru.net/OpenSourceTools/Extractor', '_blank');
      onClose();
    } else {
      onRadioChange({ target: { value: optionValue } });
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle>
        {t('textSplit.pdfProcess')}
      </DialogTitle>
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
          />
        </Box>
      </DialogContent>
    </Dialog>
  );
}