// styles/home.js
export const styles = {
  heroSection: {
    pt: { xs: 6, md: 10 },
    pb: { xs: 6, md: 8 },
    position: 'relative',
    overflow: 'hidden',
    transition: 'all 0.3s ease-in-out'
  },
  heroBackground: theme => ({
    // Use global single-color background; keep transparent here for consistency
    background: 'transparent',
    '&::before': {
      display: 'none'
    }
  }),
  decorativeCircle: {
    position: 'absolute',
    width: '800px',
    height: '800px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, rgba(42, 92, 170, 0) 70%)',
    top: '-300px',
    right: '-200px',
    zIndex: 0,
    animation: 'pulse 15s infinite ease-in-out',
    '@keyframes pulse': {
      '0%': { transform: 'scale(1)' },
      '50%': { transform: 'scale(1.05)' },
      '100%': { transform: 'scale(1)' }
    }
  },
  decorativeCircleSecond: {
    position: 'absolute',
    width: '500px',
    height: '500px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(56, 189, 248, 0.08) 0%, rgba(139, 92, 246, 0) 70%)',
    bottom: '-200px',
    left: '-100px',
    zIndex: 0,
    animation: 'pulse2 20s infinite ease-in-out',
    '@keyframes pulse2': {
      '0%': { transform: 'scale(1)' },
      '50%': { transform: 'scale(1.08)' },
      '100%': { transform: 'scale(1)' }
    }
  },
  gradientTitle: theme => ({
    mb: 2,
    background: theme.palette.gradient.primary,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    textFillColor: 'transparent'
  }),
  createButton: theme => ({
    mt: 3,
    px: 4,
    py: 1.2,
    borderRadius: '12px',
    fontSize: '1rem',
    background: theme.palette.gradient.primary,
    '&:hover': {
      boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)'
    }
  }),
  statsCard: theme => ({
    mt: 6,
    p: { xs: 2, md: 4 },
    borderRadius: '16px',
    boxShadow: theme.palette.mode === 'dark' ? '0 8px 24px rgba(0, 0, 0, 0.2)' : '0 8px 24px rgba(0, 0, 0, 0.05)',
    background: theme.palette.mode === 'dark' ? 'rgba(30, 30, 30, 0.6)' : 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(8px)'
  }),
  projectCard: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'visible',
    position: 'relative'
  },
  projectAvatar: {
    position: 'absolute',
    top: -16,
    left: 24,
    zIndex: 1
  },
  projectDescription: {
    mb: 2,
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: 2,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    height: '40px'
  }
};
