import { Autocomplete, TextField, CircularProgress, TextFieldProps, SxProps } from '@mui/material';
import { useState, useEffect, useMemo } from 'react';
import { Station } from '../../types/booking';
import { ApiClient } from '../../services/ApiClient';

interface StationAutocompleteProps {
  value: Station | null;
  onChange: (station: Station | null) => void;
  label: string;
  disabled?: boolean;
  InputProps?: Partial<TextFieldProps['InputProps']>;
  placeholder?: string;
  sx?: SxProps;
}

export const StationAutocomplete = ({
  value,
  onChange,
  label,
  disabled = false,
  InputProps = {},
  placeholder,
  sx,
}: StationAutocompleteProps) => {
  const [options, setOptions] = useState<Station[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (inputValue.length < 3) {
      setOptions([]);
      return;
    }

    const fetchStations = async () => {
      try {
        setLoading(true);
        setError(null);
        const apiClient = new ApiClient('/api');
        // Here we would ideally have an API endpoint that searches across all stations
        // For now, we'll fetch from a default country (e.g., Germany 'DE')
        const stations = await apiClient.request<Station[]>(
          `/stations/country/DE?corporateCustomerNumber=98765`,
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

    const timer = setTimeout(() => {
      fetchStations();
    }, 300);

    return () => clearTimeout(timer);
  }, [inputValue]);

  const filteredOptions = useMemo(() => {
    if (inputValue.length < 3) return [];
    return options.filter(option => 
      option.title.toLowerCase().includes(inputValue.toLowerCase()) ||
      option.subtitle.toLowerCase().includes(inputValue.toLowerCase()) ||
      option.stationInformation?.iataCode?.toLowerCase().includes(inputValue.toLowerCase())
    );
  }, [options, inputValue]);

  return (
    <Autocomplete
      sx={sx}
      value={value}
      onChange={(_, newValue) => onChange(newValue)}
      inputValue={inputValue}
      onInputChange={(_, newInputValue) => setInputValue(newInputValue)}
      options={filteredOptions}
      getOptionLabel={(option) => option.title}
      loading={loading}
      disabled={disabled}
      open={open && (loading || filteredOptions.length > 0)}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      noOptionsText={inputValue.length < 3 ? "Type at least 3 characters" : "No locations found"}
      filterOptions={(x) => x}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          error={!!error}
          helperText={error || (inputValue.length < 3 && inputValue.length > 0 ? "Type at least 3 characters" : undefined)}
          InputProps={{
            ...params.InputProps,
            ...InputProps,
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
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{option.title}</span>
              {option.stationInformation?.iataCode && (
                <span style={{ color: 'gray', marginLeft: 8 }}>
                  {option.stationInformation.iataCode}
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.8em', color: 'gray' }}>{option.subtitle}</div>
          </div>
        </li>
      )}
    />
  );
}; 