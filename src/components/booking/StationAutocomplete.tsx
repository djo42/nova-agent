import { Autocomplete, TextField, CircularProgress, TextFieldProps, SxProps, Box, Typography } from '@mui/material';
import { useState, useEffect, useMemo, HTMLAttributes } from 'react';
import { Station } from '../../types/booking';
import { ApiClient } from '../../services/ApiClient';
import FlightIcon from '@mui/icons-material/Flight';
import TrainIcon from '@mui/icons-material/Train';
import BusinessIcon from '@mui/icons-material/Business';

interface StationAutocompleteProps {
  value: Station | null;
  onChange: (station: Station | null) => void;
  label: string;
  disabled?: boolean;
  InputProps?: Partial<TextFieldProps['InputProps']>;
  placeholder?: string;
  sx?: SxProps;
}

const sortStations = (stations: Station[], inputValue: string) => {
  return stations.sort((a, b) => {
    // Helper function to check if station has a specific subtype
    const hasSubtype = (station: Station, type: string) => 
      station.subtypes?.some(subtype => subtype.toLowerCase().includes(type.toLowerCase()));

    // Check for airport subtype
    const aIsAirport = hasSubtype(a, 'airport');
    const bIsAirport = hasSubtype(b, 'airport');

    // If searching with a 3-letter code, prioritize matching airports
    if (inputValue.length === 3) {
      const searchUpper = inputValue.toUpperCase();
      const aMatchesCode = a.stationInformation?.iataCode === searchUpper;
      const bMatchesCode = b.stationInformation?.iataCode === searchUpper;

      if (aMatchesCode && !bMatchesCode) return -1;
      if (!aMatchesCode && bMatchesCode) return 1;
    }

    // Sort airports first
    if (aIsAirport && !bIsAirport) return -1;
    if (!aIsAirport && bIsAirport) return 1;

    // Then sort by railway stations
    const aIsRailway = hasSubtype(a, 'railway') || hasSubtype(a, 'train');
    const bIsRailway = hasSubtype(b, 'railway') || hasSubtype(b, 'train');
    if (aIsRailway && !bIsRailway) return -1;
    if (!aIsRailway && bIsRailway) return 1;

    // Finally sort alphabetically
    return (a.title || '').localeCompare(b.title || '');
  });
};

const getStationIcon = (station: Station) => {
  const hasSubtype = (type: string) => 
    station.subtypes?.some(subtype => subtype.toLowerCase().includes(type.toLowerCase()));

  if (hasSubtype('airport')) {
    return <FlightIcon sx={{ color: 'text.secondary', mr: 1 }} />;
  }
  if (hasSubtype('railway') || hasSubtype('train')) {
    return <TrainIcon sx={{ color: 'text.secondary', mr: 1 }} />;
  }
  return <BusinessIcon sx={{ color: 'text.secondary', mr: 1 }} />;
};

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

  const filteredOptions = useMemo(() => {
    if (inputValue.length < 3) return [];
    return sortStations(
      options.filter(option => 
        option.title?.toLowerCase().includes(inputValue.toLowerCase()) ||
        option.subtitle?.toLowerCase().includes(inputValue.toLowerCase()) ||
        option.stationInformation?.iataCode?.toLowerCase().includes(inputValue.toLowerCase())
      ),
      inputValue
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
          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            {getStationIcon(option)}
            <Box>
              <Typography variant="body1">
                {option.title}
                {option.stationInformation?.iataCode && (
                  <Typography 
                    component="span" 
                    sx={{ 
                      ml: 1,
                      color: 'text.secondary',
                      fontSize: '0.875rem'
                    }}
                  >
                    ({option.stationInformation.iataCode})
                  </Typography>
                )}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {option.subtitle}
              </Typography>
            </Box>
          </Box>
        </li>
      )}
    />
  );
}; 