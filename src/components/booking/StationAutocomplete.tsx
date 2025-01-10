import { Autocomplete, TextField, CircularProgress } from '@mui/material';
import { useState, useEffect } from 'react';
import { Station } from '../../types/booking';
import { ApiClient } from '../../services/ApiClient';

interface StationAutocompleteProps {
  countryCode: string | null;
  value: Station | null;
  onChange: (station: Station | null) => void;
  label: string;
  disabled?: boolean;
}

export const StationAutocomplete = ({
  countryCode,
  value,
  onChange,
  label,
  disabled = false
}: StationAutocompleteProps) => {
  const [options, setOptions] = useState<Station[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!countryCode) {
      setOptions([]);
      return;
    }

    const fetchStations = async () => {
      try {
        setLoading(true);
        setError(null);
        const apiClient = new ApiClient('/api');
        const stations = await apiClient.request<Station[]>(
          `/stations/country/${countryCode}?corporateCustomerNumber=98765`,
          {
            headers: {
              'Accept-Language': 'en-US'
            }
          }
        );
        setOptions(stations);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch stations');
        setOptions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStations();
  }, [countryCode]);

  return (
    <Autocomplete
      value={value}
      onChange={(_, newValue) => onChange(newValue)}
      options={options}
      getOptionLabel={(option) => option.title}
      loading={loading}
      disabled={disabled || !countryCode}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          error={!!error}
          helperText={error}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading && <CircularProgress color="inherit" size={20} />}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
      renderOption={(props, option) => (
        <li {...props}>
          <div>
            <div>{option.title}</div>
            <div style={{ fontSize: '0.8em', color: 'gray' }}>{option.subtitle}</div>
          </div>
        </li>
      )}
    />
  );
}; 