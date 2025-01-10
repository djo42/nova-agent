import { useState, useEffect } from 'react';
import { Country } from '../types/booking';
import { ApiClient } from '../services/ApiClient';

export const useCountries = () => {
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        setLoading(true);
        setError(null);
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
    };

    fetchCountries();
  }, []);

  return { countries, loading, error };
}; 