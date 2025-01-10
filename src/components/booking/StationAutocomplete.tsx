import { Autocomplete, TextField, CircularProgress, TextFieldProps, SxProps, Box, Typography } from '@mui/material';
import { useState, useEffect, useMemo, HTMLAttributes } from 'react';
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

  const sortStations = (stations: Station[]) => {
    return stations.sort((a, b) => {
      // Define station type priorities with more specific types
      const typePriority: Record<string, number> = {
        'AIRPORT': 1,
        'TERMINAL': 1, // Also consider terminals as high priority
        'RAILWAY': 2,
        'TRAIN_STATION': 2,
        'CITY': 3,
        'DOWNTOWN': 3,
        'other': 4
      };

      // Get station types, convert to uppercase for consistency
      const typeA = (a.stationType || '').toUpperCase();
      const typeB = (b.stationType || '').toUpperCase();

      // Get priority for each station (default to 'other')
      const priorityA = typePriority[typeA] || typePriority.other;
      const priorityB = typePriority[typeB] || typePriority.other;

      // Sort by priority first
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      // For airports, sort by IATA code presence
      if (priorityA === typePriority.AIRPORT) {
        const hasIataA = !!a.stationInformation?.iataCode;
        const hasIataB = !!b.stationInformation?.iataCode;
        if (hasIataA !== hasIataB) {
          return hasIataA ? -1 : 1;
        }
      }

      // If same priority, sort alphabetically
      return (a.title || '').localeCompare(b.title || '');
    });
  };

  const filteredOptions = useMemo(() => {
    if (inputValue.length < 3) return [];
    return sortStations(options.filter(option => 
      option.title?.toLowerCase().includes(inputValue.toLowerCase()) ||
      option.subtitle?.toLowerCase().includes(inputValue.toLowerCase()) ||
      option.stationInformation?.iataCode?.toLowerCase().includes(inputValue.toLowerCase())
    ));
  }, [options, inputValue]);

  return (
    <Autocomplete
      sx={sx}
      value={value}
      onChange={(_, newValue) => onChange(newValue)}
      inputValue={inputValue}
      onInputChange={(_, newInputValue) => setInputValue(newInputValue)}
      options={filteredOptions}
      getOptionLabel={(option) => option.title || ''}
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
      renderOption={(props: HTMLAttributes<HTMLLIElement>, option: Station) => (
        <li {...props}>
          <Box>
            <Typography variant="body1">{option.title}</Typography>
            <Typography variant="caption" color="text.secondary">
              {option.stationType?.toUpperCase()} - {option.subtitle}
            </Typography>
          </Box>
        </li>
      )}
    />
  );
}; 