import { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  TextField, 
  InputAdornment,
  ToggleButtonGroup,
  ToggleButton,
  Autocomplete,
  Typography,
  CircularProgress,
  Tabs,
  Tab,
  Divider,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PlaceIcon from '@mui/icons-material/Place';
import ListIcon from '@mui/icons-material/List';
import { Station } from '../../types/booking';
import { ApiClient } from '../../services/ApiClient';
import { useGoogleMaps } from '../../contexts/GoogleMapsContext';
import FlightIcon from '@mui/icons-material/Flight';
import TrainIcon from '@mui/icons-material/Train';
import BusinessIcon from '@mui/icons-material/Business';

interface LocationSearchProps {
  onStationSelect: (station: Station | null) => void;
  label: string;
  placeholder?: string;
  searchMode: SearchMode;
  value: Station | null;
  onChange: (station: Station | null) => void;
}

interface PlaceOption {
  place_id: string;
  description: string;
}

const RADIUS_OPTIONS = [5, 10, 20, 50, 100];

type SearchMode = 'location' | 'station';

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

export const LocationSearch = ({ 
  value,
  onChange,
  label, 
  placeholder,
  searchMode,
}: LocationSearchProps) => {
  const [radius, setRadius] = useState(10);
  const [loading, setLoading] = useState(false);
  const [stations, setStations] = useState<Station[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [selectedValue, setSelectedValue] = useState<PlaceOption | null>(null);
  const [suggestions, setSuggestions] = useState<PlaceOption[]>([]);
  const [allStations, setAllStations] = useState<Station[]>([]);
  
  const { isLoaded } = useGoogleMaps();

  // Fetch all stations for direct station search
  useEffect(() => {
    const fetchStations = async () => {
      try {
        const apiClient = new ApiClient('/api');
        const stations = await apiClient.request<Station[]>(
          `/stations/country/DE?corporateCustomerNumber=98765`,
          {
            headers: {
              'Accept-Language': 'en-US'
            }
          }
        );
        setAllStations(sortAndGroupStations(stations));
      } catch (error) {
        console.error('Error fetching stations:', error);
      }
    };

    fetchStations();
  }, []);

  // Handle place predictions
  useEffect(() => {
    if (!isLoaded || !inputValue || searchMode !== 'location') {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const service = new google.maps.places.AutocompleteService();
        const response = await service.getPlacePredictions({
          input: inputValue,
          componentRestrictions: { country: 'de' },
        });
        
        if (response?.predictions) {
          const formattedResults = response.predictions.map(prediction => ({
            place_id: prediction.place_id,
            description: prediction.description,
          }));
          setSuggestions(formattedResults);
        }
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [inputValue, isLoaded, searchMode]);

  const handlePlaceSelect = useCallback(async (placeId: string) => {
    if (!isLoaded) return;
    
    try {
      setLoading(true);
      const geocoder = new google.maps.Geocoder();
      const result = await geocoder.geocode({ placeId });
      
      if (result.results[0]?.geometry?.location) {
        const { lat, lng } = result.results[0].geometry.location;
        
        const apiClient = new ApiClient('/api');
        const nearbyStations = await apiClient.request<Station[]>(
          `/stations/geo?latitude=${lat()}&longitude=${lng()}&maxDistance=${radius}`,
          {
            headers: {
              'Accept-Language': 'en-US'
            }
          }
        );
        
        setStations(nearbyStations);
      }
    } catch (error) {
      console.error('Error fetching nearby stations:', error);
    } finally {
      setLoading(false);
    }
  }, [radius, isLoaded]);

  const renderSearchInput = () => {
    if (searchMode === 'location') {
      return (
        <>
          <Autocomplete
            value={selectedValue}
            onChange={(_, newValue: PlaceOption | null) => {
              setSelectedValue(newValue);
              if (newValue?.place_id) {
                handlePlaceSelect(newValue.place_id);
              }
            }}
            inputValue={inputValue}
            onInputChange={(_, newInputValue) => {
              setInputValue(newInputValue);
            }}
            options={suggestions}
            getOptionLabel={(option) => option.description}
            isOptionEqualToValue={(option, value) => option.place_id === value.place_id}
            filterOptions={(x) => x}
            freeSolo
            renderInput={(params) => (
              <TextField
                {...params}
                label={label}
                placeholder={isLoaded ? "Enter location to find nearby stations" : 'Loading...'}
                disabled={!isLoaded}
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <InputAdornment position="start">
                      <PlaceIcon />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <>
                      {(loading || !isLoaded) && <CircularProgress color="inherit" size={20} />}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
            renderOption={(props, option) => (
              <li {...props}>
                <LocationOnIcon sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="body2">{option.description}</Typography>
              </li>
            )}
          />

          <Box sx={{ mt: 1 }}>
            <ToggleButtonGroup
              value={radius}
              exclusive
              onChange={(_, value) => value && setRadius(value)}
              size="small"
              sx={{ 
                width: '100%',
                '& .MuiToggleButton-root': {
                  flex: 1,
                }
              }}
            >
              {RADIUS_OPTIONS.map((option) => (
                <ToggleButton key={option} value={option}>
                  {option} km
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>
        </>
      );
    }

    return (
      <Autocomplete
        options={allStations}
        getOptionLabel={(station) => station.title}
        onChange={(_, station) => onChange(station)}
        groupBy={(option) => {
          const subtypes = option.subtypes?.map(s => s.toLowerCase()) || [];
          if (subtypes.includes('airport')) return 'Airports';
          if (subtypes.includes('railway') || subtypes.includes('train_station')) return 'Railway Stations';
          return 'Downtown Locations';
        }}
        renderOption={(props, station) => (
          <li {...props}>
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              {getStationIcon(station)}
              <Box>
                <Typography variant="body1">
                  {station.title}
                  {station.stationInformation?.iataCode && (
                    <Typography 
                      component="span" 
                      sx={{ 
                        ml: 1,
                        color: 'text.secondary',
                        fontSize: '0.875rem',
                        fontWeight: 'medium'
                      }}
                    >
                      ({station.stationInformation.iataCode})
                    </Typography>
                  )}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {station.subtitle}
                </Typography>
              </Box>
            </Box>
          </li>
        )}
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
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            placeholder="Search stations directly"
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        )}
      />
    );
  };

  return (
    <Box>
      {renderSearchInput()}

      {searchMode === 'location' && stations.length > 0 && (
        <Autocomplete
          options={stations}
          getOptionLabel={(station) => station.title}
          onChange={(_, station) => onChange(station)}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Select nearby station"
              fullWidth
              sx={{ mt: 2 }}
            />
          )}
          renderOption={(props, station) => (
            <li {...props}>
              <Box>
                <Typography variant="body1">
                  {station.title}
                  <Typography 
                    component="span" 
                    color="text.secondary" 
                    sx={{ ml: 1 }}
                  >
                    ({station.distance.toFixed(1)} km)
                  </Typography>
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {station.subtitle}
                </Typography>
              </Box>
            </li>
          )}
        />
      )}
    </Box>
  );
}; 