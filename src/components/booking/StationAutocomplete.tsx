import { Autocomplete, TextField, CircularProgress, TextFieldProps, SxProps, Box, Typography, Divider } from '@mui/material';
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

const sortAndGroupStations = (stations: Station[]) => {
  // Group stations by type
  const groups = stations.reduce((acc, station) => {
    const subtypes = station.subtypes?.map(s => s.toLowerCase()) || [];
    
    if (subtypes.includes('airport')) {
      acc.airports.push(station);
    } else if (subtypes.includes('railway') || subtypes.includes('train_station')) {
      acc.railways.push(station);
    } else {
      acc.others.push(station);
    }
    return acc;
  }, { airports: [] as Station[], railways: [] as Station[], others: [] as Station[] });

  // Sort airports by IATA code first, then alphabetically
  groups.airports.sort((a, b) => {
    const aCode = a.stationInformation?.iataCode;
    const bCode = b.stationInformation?.iataCode;
    
    // IATA code stations first
    if (aCode && !bCode) return -1;
    if (!aCode && bCode) return 1;
    if (aCode && bCode) {
      // If both have IATA codes, sort by code
      return aCode.localeCompare(bCode);
    }
    // If neither has IATA code, sort by title
    return (a.title || '').localeCompare(b.title || '');
  });

  // Sort railways and others alphabetically
  const sortByTitle = (a: Station, b: Station) => (a.title || '').localeCompare(b.title || '');
  groups.railways.sort(sortByTitle);
  groups.others.sort(sortByTitle);

  // Combine all groups in order
  return [...groups.airports, ...groups.railways, ...groups.others];
};

const getStationIcon = (station: Station) => {
  const subtypes = station.subtypes?.map(s => s.toLowerCase()) || [];
  
  if (subtypes.includes('airport')) {
    return <FlightIcon sx={{ color: 'text.secondary', mr: 1 }} />;
  }
  if (subtypes.includes('railway') || subtypes.includes('train_station')) {
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
    
    const filtered = options.filter(option => 
      option.title?.toLowerCase().includes(inputValue.toLowerCase()) ||
      option.subtitle?.toLowerCase().includes(inputValue.toLowerCase()) ||
      option.stationInformation?.iataCode?.toLowerCase() === inputValue.toLowerCase()
    );

    return sortAndGroupStations(filtered);
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
      renderOption={(props, option) => (
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
                      fontSize: '0.875rem',
                      fontWeight: 'medium'
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
      groupBy={(option) => {
        const subtypes = option.subtypes?.map(s => s.toLowerCase()) || [];
        if (subtypes.includes('airport')) return 'Airports';
        if (subtypes.includes('railway') || subtypes.includes('train_station')) return 'Railway Stations';
        return 'Downtown Locations';
      }}
      renderGroup={(params) => (
        <Box key={params.key}>
          <Typography
            variant="subtitle2"
            sx={{
              px: 2,
              py: 1,
              backgroundColor: 'grey.100',
              color: 'text.secondary',
              fontWeight: 'medium'
            }}
          >
            {params.group}
          </Typography>
          {params.children}
          <Divider />
        </Box>
      )}
    />
  );
}; 