import { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Grid, 
  Card, 
  CardContent, 
  Alert, 
  CircularProgress 
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { ApiClient } from '../services/ApiClient';
import { AuthService } from '../services/AuthService';
import { env } from '../config/env';

interface Country {
  name: string;
  iso2code: string;
}

export const Countries = () => {
  const [countries, setCountries] = useState<Country[]>([]);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const fetchCountries = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const apiClient = new ApiClient('/api');

      const data = await apiClient.request<Country[]>('/stations/countries', {
        headers: {
          'Accept-Language': 'en-US'
        }
      });
      
      setCountries(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch countries');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCountries();
  }, [fetchCountries]);

  return (
    <Box>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3 
      }}>
        <Typography variant="h4" component="h1">
          Countries
        </Typography>
        <Button
          variant="contained"
          startIcon={<RefreshIcon />}
          onClick={fetchCountries}
          disabled={loading}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
          }}
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          py: 8 
        }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {countries.map((country) => (
            <Grid item xs={12} sm={6} md={4} key={country.iso2code}>
              <Card 
                elevation={1}
                sx={{
                  height: '100%',
                  borderRadius: 2,
                  transition: 'box-shadow 0.3s',
                  '&:hover': {
                    boxShadow: 4,
                  },
                }}
              >
                <CardContent>
                  <Typography variant="h6" component="h2" gutterBottom>
                    {country.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    ISO: {country.iso2code}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}; 