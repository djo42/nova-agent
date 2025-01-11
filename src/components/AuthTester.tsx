import { useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  TextField, 
  Alert 
} from '@mui/material';
import { ApiClient } from '../services/ApiClient';

const SIXT_ORANGE = '#ff5f00';

export const AuthTester = () => {
  const [token, setToken] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleGetToken = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('/api/auth/token');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get token');
      }

      setToken(data.accessToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get token');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      setError('');
      setToken('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to logout');
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Auth Tester
      </Typography>
      
      <Box sx={{ mb: 4, display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          onClick={handleGetToken}
          disabled={loading}
          sx={{ 
            bgcolor: SIXT_ORANGE,
            '&:hover': {
              bgcolor: '#e65500'
            },
            '&:disabled': {
              bgcolor: '#ffd1b3'
            }
          }}
        >
          {loading ? 'Getting Token...' : 'Get Token'}
        </Button>
        
        <Button
          variant="outlined"
          onClick={handleLogout}
          disabled={!token || loading}
          sx={{ 
            color: SIXT_ORANGE,
            borderColor: SIXT_ORANGE,
            '&:hover': {
              borderColor: '#e65500',
              color: '#e65500'
            }
          }}
        >
          Logout
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <TextField
        fullWidth
        multiline
        rows={4}
        value={token}
        label="Access Token"
        variant="outlined"
        InputProps={{
          readOnly: true,
        }}
        sx={{ 
          fontFamily: 'monospace',
          '& .MuiInputBase-input': {
            fontFamily: 'monospace',
          }
        }}
      />
    </Box>
  );
}; 