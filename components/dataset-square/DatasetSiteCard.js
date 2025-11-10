'use client';

import { Card, CardActionArea, CardContent, CardMedia, Typography, Box, Chip, useTheme, alpha } from '@mui/material';
import LaunchIcon from '@mui/icons-material/Launch';
import StorageIcon from '@mui/icons-material/Storage';
import { useTranslation } from 'react-i18next';

export function DatasetSiteCard({ site }) {
  const { name, link, description, labels } = site;
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { t } = useTranslation();

  // 处理卡片点击
  const handleCardClick = () => {
    window.open(link, '_blank');
  };

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s ease',
        borderRadius: 2,
        overflow: 'hidden',
        boxShadow: theme.palette.mode === 'dark' ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.1)',
        '&:hover': {
          transform: 'translateY(-6px)',
          boxShadow: theme.palette.mode === 'dark' ? '0 8px 30px rgba(0,0,0,0.4)' : '0 8px 30px rgba(0,0,0,0.15)',
          '& .MuiCardMedia-root': {
            transform: 'scale(1.05)'
          }
        }
      }}
    >
      <CardActionArea
        onClick={handleCardClick}
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          height: '100%',
          '&:hover': {
            '& .card-content': {
              background:
                theme.palette.mode === 'dark'
                  ? alpha(theme.palette.primary.dark, 0.1)
                  : alpha(theme.palette.primary.light, 0.1)
            }
          }
        }}
      >
        {/* 网站截图 */}
        <Box sx={{ position: 'relative', width: '100%', height: 160, overflow: 'hidden' }}>
          <CardMedia
            component="div"
            role="img"
            aria-label={name}
            sx={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
              px: 3,
              textAlign: 'center',
              transition: 'transform 0.5s ease',
              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.4)}`,
              background: isDark
                ? `radial-gradient(circle at 20% 20%, ${alpha(theme.palette.primary.light, 0.25)}, transparent 55%),
                   radial-gradient(circle at 80% 0%, ${alpha(theme.palette.secondary.light, 0.35)}, transparent 45%),
                   linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.45)}, ${alpha(
                    theme.palette.secondary.dark,
                    0.35
                  )})`
                : `radial-gradient(circle at 15% 20%, ${alpha(theme.palette.primary.light, 0.35)}, transparent 60%),
                   radial-gradient(circle at 85% 0%, ${alpha(theme.palette.secondary.light, 0.25)}, transparent 55%),
                   linear-gradient(120deg, ${alpha(theme.palette.background.default, 1)}, ${alpha(
                    theme.palette.primary.light,
                    0.45
                  )})`,
              color: isDark ? theme.palette.primary.contrastText : theme.palette.primary.dark,
              letterSpacing: 0.4,
              fontWeight: 700,
              fontSize: '1.05rem',
              textTransform: 'uppercase'
            }}
          >
            <Box
              component="span"
              sx={{
                position: 'relative',
                zIndex: 2,
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                alignItems: 'center'
              }}
            >
              <Box
                sx={{
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  letterSpacing: 1.5,
                  textTransform: 'uppercase',
                  color: isDark
                    ? alpha(theme.palette.common.white, 0.85)
                    : alpha(theme.palette.primary.dark, 0.8)
                }}
              >
                Dataset Portal
              </Box>
              <Box
                component="span"
                sx={{
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  textTransform: 'none',
                  color: isDark ? theme.palette.common.white : theme.palette.primary.dark
                }}
              >
                {name}
              </Box>
              <Box
                sx={{
                  width: 64,
                  height: 2,
                  borderRadius: 1,
                  bgcolor: isDark
                    ? alpha(theme.palette.common.white, 0.7)
                    : alpha(theme.palette.primary.main, 0.6)
                }}
              />
            </Box>
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                backgroundImage: isDark
                  ? 'linear-gradient(45deg, rgba(255,255,255,0.08) 0%, transparent 40%), linear-gradient(-45deg, rgba(255,255,255,0.06) 0%, transparent 40%)'
                  : 'linear-gradient(45deg, rgba(255,255,255,0.3) 0%, transparent 45%), linear-gradient(-45deg, rgba(255,255,255,0.25) 0%, transparent 40%)',
                backgroundSize: '140px 140px',
                opacity: isDark ? 0.5 : 0.4,
                zIndex: 1
              }}
            />
          </CardMedia>
          <Chip
            icon={<StorageIcon fontSize="small" />}
            label={t('datasetSquare.dataset')}
            size="small"
            sx={{
              position: 'absolute',
              top: 10,
              right: 10,
              zIndex: 2,
              backgroundColor: alpha(theme.palette.background.paper, 0.8),
              backdropFilter: 'blur(4px)',
              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              '& .MuiChip-icon': {
                color: theme.palette.primary.main
              }
            }}
          />
        </Box>

        {/* 网站信息 */}
        <CardContent
          className="card-content"
          sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            transition: 'background 0.3s ease',
            p: 2.5
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
            <Typography
              variant="h6"
              component="div"
              sx={{
                fontWeight: 600,
                lineHeight: 1.3,
                mb: 0.5,
                pr: 2, // 留出空间给图标
                color: theme.palette.mode === 'dark' ? theme.palette.primary.light : theme.palette.primary.dark
              }}
            >
              {name}
            </Typography>
            <LaunchIcon
              fontSize="small"
              sx={{
                color: theme.palette.mode === 'dark' ? theme.palette.primary.light : theme.palette.primary.main,
                opacity: 0.8,
                mt: 0.5
              }}
            />
          </Box>

          <Typography
            variant="body2"
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              color: theme.palette.text.secondary,
              lineHeight: 1.6,
              mb: 1
            }}
          >
            {description}
          </Typography>

          <Box sx={{ mt: 'auto', pt: 1.5 }}>
            {/* 标签显示 */}
            {labels && labels.length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.5 }}>
                {labels.map((label, index) => (
                  <Chip
                    key={index}
                    label={label}
                    size="small"
                    sx={{
                      borderRadius: 1,
                      height: 20,
                      fontSize: '0.65rem',
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      color: theme.palette.primary.main,
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.2)
                      }
                    }}
                  />
                ))}
              </Box>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Chip
                label={t('datasetSquare.viewDataset')}
                size="small"
                color="primary"
                variant="outlined"
                sx={{
                  borderRadius: 1,
                  height: 24,
                  fontSize: '0.75rem',
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.1)
                  }
                }}
              />
            </Box>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
