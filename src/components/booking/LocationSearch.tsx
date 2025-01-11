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
  Alert,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PlaceIcon from '@mui/icons-material/Place';
import ListIcon from '@mui/icons-material/List';
import { ApiClient } from '../../services/ApiClient';
import { useGoogleMaps } from '../../contexts/GoogleMapsContext';
import FlightIcon from '@mui/icons-material/Flight';
import TrainIcon from '@mui/icons-material/Train';
import BusinessIcon from '@mui/icons-material/Business';

interface Station {
  id: string;
  title: string;
  subtitle: string;
  subtypes: string[];
  distance?: number;
  stationInformation?: {
    iataCode?: string;
  };
}

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

const RADIUS_OPTIONS = [5, 10, 20, 50, 100] as const;
type RadiusOption = typeof RADIUS_OPTIONS[number];

type SearchMode = 'location' | 'station';

const sortAndGroupStations = (stations: Station[], sortByDistance: boolean = false) => {
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

  // Sort function based on distance or IATA code
  const sortStations = (a: Station, b: Station) => {
    if (sortByDistance) {
      return (a.distance || 0) - (b.distance || 0);
    }
    
    // Original IATA code sorting for station list
    const aCode = a.stationInformation?.iataCode;
    const bCode = b.stationInformation?.iataCode;
    if (aCode && !bCode) return -1;
    if (!aCode && bCode) return 1;
    if (aCode && bCode) return aCode.localeCompare(bCode);
    return (a.title || '').localeCompare(b.title || '');
  };

  // Sort each group
  groups.airports.sort(sortStations);
  groups.railways.sort(sortStations);
  groups.others.sort(sortStations);

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

const generateUniqueKey = (prefix: string, value?: string | number) => 
  `${prefix}-${value || Math.random().toString(36).substr(2, 9)}`;

export const LocationSearch = ({ 
  value,
  onChange,
  label, 
  placeholder,
  searchMode,
}: LocationSearchProps) => {
  const [radius, setRadius] = useState<RadiusOption>(10);
  const [loading, setLoading] = useState(false);
  const [stations, setStations] = useState<Station[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [selectedValue, setSelectedValue] = useState<PlaceOption | null>(null);
  const [suggestions, setSuggestions] = useState<PlaceOption[]>([]);
  const [allStations, setAllStations] = useState<Station[]>([]);
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  
  const { isLoaded } = useGoogleMaps();

  // Fetch all stations for direct station search
  useEffect(() => {
    const fetchStations = async () => {
      try {
        const apiClient = new ApiClient(process.env.NEXT_PUBLIC_SIXT_API_URL);
        const stations = await apiClient.request<Station[]>(
          `/stations/country/DE?corporateCustomerNumber=98765`,
          {
            headers: {
              'Accept-Language': 'ko_KR'
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
          types: ['geocode', 'establishment'],
          language: 'en',
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

  // Handle nearby stations search
  const searchNearbyStations = useCallback(async (lat: number, lng: number) => {
    try {
      setLoading(true);
      setShowWarning(false);
      const apiClient = new ApiClient(process.env.NEXT_PUBLIC_SIXT_API_URL);
      
      const latitude = Number(lat).toFixed(6);
      const longitude = Number(lng).toFixed(6);
      
      console.log('Current radius state in search:', radius);
      
      const url = `/stations/geo?latitude=${latitude}&longitude=${longitude}&maxDistance=${radius}&country=DE`;

      console.log('Making request with radius:', radius);
      console.log('Full URL:', `${process.env.NEXT_PUBLIC_SIXT_API_URL}${url}`);
      
      const nearbyStations = await apiClient.request<Station[]>(
        url,
        {
          headers: {
            'accept': 'application/json',
            'Accept-Language': 'en_US',
            'Content-Type': 'application/json'
          }
        }
      );
      setStations(Array.isArray(nearbyStations) ? sortAndGroupStations(nearbyStations, true) : []);
    } catch (error) {
      console.error('API Error:', {
        error,
        requestUrl: `/stations/geo?latitude=${lat}&longitude=${lng}&maxDistance=${radius}&country=DE`,
        usedRadius: radius
      });
      setStations([]);
      setShowWarning(true);
      setWarningMessage('No branches found in this area. Please try a different location or increase the search radius.');
    } finally {
      setLoading(false);
    }
  }, [radius]);

  // Handle place selection
  const handlePlaceSelect = useCallback(async (placeId: string) => {
    if (!isLoaded) return;
    
    try {
      setLoading(true);
      const geocoder = new google.maps.Geocoder();
      const result = await geocoder.geocode({ 
        placeId,
        language: 'en'
      });
      
      if (result.results[0]?.geometry?.location) {
        const { lat, lng } = result.results[0].geometry.location;
        await searchNearbyStations(lat(), lng());
      }
    } catch (error) {
      console.error('Error geocoding place:', error);
    }
  }, [isLoaded, searchNearbyStations]);

  // Handle radius change
  const handleRadiusChange = useCallback((event: React.MouseEvent<HTMLElement>, newRadius: RadiusOption | null) => {
    if (newRadius !== null) {
      console.log('Setting new radius:', newRadius);
      setRadius(newRadius);
    }
  }, []);

  // Move this effect after all function definitions
  useEffect(() => {
    console.log('Radius changed in effect:', radius);
    if (selectedValue?.place_id) {
      handlePlaceSelect(selectedValue.place_id);
    }
  }, [radius, selectedValue, handlePlaceSelect]);

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
            getOptionLabel={(option: string | PlaceOption) => 
              typeof option === 'string' ? option : option.description}
            isOptionEqualToValue={(option: string | PlaceOption, value: string | PlaceOption) => 
              typeof option === 'string' || typeof value === 'string' ? false : option.place_id === value.place_id}
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
            renderOption={(props, option: PlaceOption) => {
              const { key, ...otherProps } = props;
              return (
                <li key={generateUniqueKey('place', option.place_id!)} {...otherProps}>
                  <LocationOnIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2">{option.description}</Typography>
                </li>
              );
            }}
          />

          <Box sx={{ mt: 1 }}>
            <ToggleButtonGroup
              value={radius}
              exclusive
              onChange={handleRadiusChange}
              size="small"
              sx={{ 
                width: '100%',
                '& .MuiToggleButton-root': {
                  flex: 1,
                }
              }}
            >
              {RADIUS_OPTIONS.map((option) => (
                <ToggleButton 
                  key={`radius-${option}`}
                  value={option}
                >
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
        renderOption={(props, station) => {
          const { key, ...otherProps } = props;
          return (
            <li key={generateUniqueKey('station', station.id || station.title)} {...otherProps}>
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
          );
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
      {showWarning && (
        <Alert 
          severity="warning" 
          sx={{ mb: 2 }}
          onClose={() => setShowWarning(false)}
        >
          {warningMessage}
        </Alert>
      )}
      {renderSearchInput()}

      {searchMode === 'location' && stations.length > 0 && (
        <Autocomplete
          options={stations}
          getOptionLabel={(station) => station.title}
          onChange={(_, station) => onChange(station)}
          groupBy={(option) => {
            const subtypes = option.subtypes?.map(s => s.toLowerCase()) || [];
            if (subtypes.includes('airport')) return 'Airports';
            if (subtypes.includes('railway') || subtypes.includes('train_station')) return 'Railway Stations';
            return 'Downtown Locations';
          }}
          renderOption={(props, station) => {
            const { key, ...otherProps } = props;
            return (
              <li key={generateUniqueKey('station', station.id || station.title)} {...otherProps}>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  {getStationIcon(station)}
                  <Box>
                    <Typography variant="body1">
                      {station.title}
                      <Typography 
                        component="span" 
                        sx={{ 
                          ml: 1,
                          color: 'text.secondary',
                          fontSize: '0.875rem'
                        }}
                      >
                        ({station.distance?.toFixed(1) ?? 0} km)
                      </Typography>
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {station.subtitle}
                    </Typography>
                  </Box>
                </Box>
              </li>
            );
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
          renderInput={(params) => (
            <TextField
              {...params}
              label="Select nearby station"
              fullWidth
              sx={{ mt: 2 }}
            />
          )}
        />
      )}
    </Box>
  );
}; 