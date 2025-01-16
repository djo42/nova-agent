import { Box, CircularProgress } from '@mui/material';
import { SIXT_ORANGE } from '../../constants';

export const LoadingOverlay = () => (
  <Box
    sx={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      borderRadius: 1,
    }}
  >
    <CircularProgress sx={{ color: SIXT_ORANGE }} />
  </Box>
); 