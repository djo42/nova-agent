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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Modal,
  Grid,
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

const SIXT_ORANGE = '#ff5f00';

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
  onError?: (message: string | null) => void;
}

interface PlaceOption {
  place_id: string;
  description: string;
}

const RADIUS_OPTIONS = [5, 10, 20, 50, 100] as const;
type RadiusOption = typeof RADIUS_OPTIONS[number];

type SearchMode = 'location' | 'station';

interface Country {
  name: string;
  iso2code: string;
}

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

  // Sort function based on mode
  const sortStations = (a: Station, b: Station) => {
    if (sortByDistance && a.distance !== undefined && b.distance !== undefined) {
      return a.distance - b.distance;
    }
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

const generateUniqueKey = (prefix: string, value: string | number | undefined): string => {
  if (typeof value === 'undefined') {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  }
  return `${prefix}-${value}`;
};

const LoadingOverlay = () => (
  <Box
    sx={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      borderRadius: 1,
    }}
  >
    <CircularProgress sx={{ color: '#ff5f00' }} />
  </Box>
);

export const LocationSearch = ({ 
  value,
  onChange,
  label, 
  placeholder,
  searchMode,
  onError,
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
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [countrySearchTerm, setCountrySearchTerm] = useState('');
  const [filteredCountries, setFilteredCountries] = useState<Country[]>([]);
  const [isLoadingCountries, setIsLoadingCountries] = useState(false);
  
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
      const apiClient = new ApiClient(process.env.NEXT_PUBLIC_SIXT_API_URL);
      
      const latitude = Number(lat).toFixed(6);
      const longitude = Number(lng).toFixed(6);
      
      const url = `/stations/geo?latitude=${latitude}&longitude=${longitude}&maxDistance=${radius}&country=DE`;
      
      try {
        const nearbyStations = await apiClient.request<Station[]>(url);
        if (!nearbyStations.length) {
          onError?.('No stations found. Try increasing radius.');
          setStations([]);
          return;
        }
        setStations(sortAndGroupStations(nearbyStations, true));
        onError?.(null);
      } catch (apiError: any) {
        if (apiError?.response?.status === 400 || apiError?.status === 400) {
          onError?.('No stations found. Try increasing radius.');
        } else {
          onError?.('No stations found. Try increasing radius.');
        }
        setStations([]);
      }
    } catch (error) {
      setStations([]);
      onError?.('No stations found. Try increasing radius.');
    } finally {
      setLoading(false);
    }
  }, [radius, onError]);

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

  // Add countries fetch effect
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        setIsLoadingCountries(true);
        const apiClient = new ApiClient('/api');
        const data = await apiClient.request<Country[]>('/stations/countries', {
          headers: {
            'Accept-Language': 'en-US'
          }
        });
        setCountries(data);
      } catch (error) {
        console.error('Error fetching countries:', error);
      } finally {
        setIsLoadingCountries(false);
      }
    };
    fetchCountries();
  }, []);

  // Update station fetch effect to use selected country
  useEffect(() => {
    const fetchStations = async () => {
      if (!selectedCountry) return;
      
      try {
        const apiClient = new ApiClient(process.env.NEXT_PUBLIC_SIXT_API_URL);
        const stations = await apiClient.request<Station[]>(
          `/stations/country/${selectedCountry.iso2code}`,
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

    if (searchMode === 'station') {
      fetchStations();
    }
  }, [selectedCountry, searchMode]);

  const renderSearchInput = () => {
    return (
      <Grid container spacing={2}>
        {/* Row 1: Search Field / Country Picker */}
        <Grid item xs={12}>
          {searchMode === 'location' ? (
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
                  label="Address search"
                  placeholder={isLoaded ? "Enter location to find nearby stations" : 'Loading...'}
                  disabled={!isLoaded}
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <InputAdornment position="start">
                        <PlaceIcon />
                      </InputAdornment>
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
              onKeyDown={(event) => {
                if (event.key === 'Enter' && suggestions.length > 0) {
                  const firstSuggestion = suggestions[0];
                  console.log('Selected first suggestion:', firstSuggestion);
                  setSelectedValue(firstSuggestion);
                  if (firstSuggestion?.place_id) {
                    handlePlaceSelect(firstSuggestion.place_id);
                  }
                }
              }}
            />
          ) : (
            <FormControl fullWidth>
              <Autocomplete
                options={countries}
                getOptionLabel={(country) => country.name}
                value={selectedCountry}
                onChange={(_, country) => {
                  setSelectedCountry(country);
                  onChange(null); // Reset branch selection
                }}
                loading={isLoadingCountries}
                autoHighlight
                filterOptions={(options, { inputValue }) => {
                  return options.filter(country =>
                    country.name.toLowerCase().includes(inputValue.toLowerCase()) ||
                    country.iso2code.toLowerCase().includes(inputValue.toLowerCase())
                  );
                }}
                onInputChange={(_, value) => {
                  setCountrySearchTerm(value);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Country"
                    placeholder="Search country"
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <>
                          {isLoadingCountries ? (
                            <CircularProgress color="inherit" size={20} />
                          ) : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
                renderOption={(props, country) => {
                  const { key, ...otherProps } = props;
                  return (
                    <li key={country.iso2code} {...otherProps}>
                      <Typography>
                        {country.name} ({country.iso2code})
                      </Typography>
                    </li>
                  );
                }}
              />
            </FormControl>
          )}
        </Grid>

        {/* Row 2: Radius Buttons */}
        <Grid item xs={12}>
          <ToggleButtonGroup
            value={searchMode === 'station' ? null : radius}
            exclusive
            onChange={handleRadiusChange}
            size="small"
            disabled={searchMode === 'station'}
            sx={{ 
              width: '100%',
              '& .MuiToggleButton-root': {
                flex: 1,
                bgcolor: searchMode === 'station' ? 'background.paper' : 'inherit',
                '&.Mui-selected': {
                  bgcolor: searchMode === 'station' ? 'background.paper' : `${SIXT_ORANGE}20`,
                  color: searchMode === 'station' ? 'text.disabled' : SIXT_ORANGE,
                  '&:hover': {
                    bgcolor: searchMode === 'station' ? 'background.paper' : `${SIXT_ORANGE}30`,
                  }
                },
              },
              opacity: searchMode === 'station' ? 0.5 : 1,
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
        </Grid>

        {/* Row 3: Branch Selection */}
        <Grid item xs={12}>
          {searchMode === 'location' ? (
            <Autocomplete
              options={stations}
              getOptionLabel={(station) => station.title}
              onChange={(_, station) => onChange(station)}
              disabled={!selectedValue || stations.length === 0}
              autoHighlight
              onKeyDown={(event) => {
                if (event.key === 'Enter' && stations.length > 0) {
                  event.preventDefault();
                  const inputValue = (event.target as HTMLInputElement).value.toLowerCase();
                  const filteredStations = stations.filter(station => 
                    station.title.toLowerCase().includes(inputValue)
                  );
                  // Simulate selection of first matching station
                  const stationToSelect = filteredStations.length > 0 ? filteredStations[0] : stations[0];
                  onChange(stationToSelect);
                  // Clear the input to show the selected value
                  (event.target as HTMLInputElement).blur();
                }
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={label === 'pickup' ? 'Pick-up branch' : 'Return branch'}
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
              renderOption={(props, station) => {
                const { key, ...otherProps } = props;
                return (
                  <li key={generateUniqueKey('station', station.id || station.title)} {...otherProps}>
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                      {getStationIcon(station)}
                      <Box>
                        <Typography variant="body1">
                          {station.title}
                          {searchMode === 'location' && (
                            <Typography 
                              component="span" 
                              sx={{ 
                                ml: 1,
                                color: 'text.secondary',
                                fontSize: '0.875rem',
                              }}
                            >
                              ({station.distance?.toFixed(1)} km)
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
            />
          ) : (
            <Autocomplete
              options={allStations}
              getOptionLabel={(station) => station.title}
              filterOptions={(options, { inputValue }) => {
                const searchTerm = inputValue.toLowerCase();
                return options.filter(station => 
                  station.title.toLowerCase().includes(searchTerm) ||
                  station.subtitle.toLowerCase().includes(searchTerm) ||
                  station.stationInformation?.iataCode?.toLowerCase().includes(searchTerm)
                );
              }}
              onChange={(_, station) => onChange(station)}
              disabled={!selectedCountry}
              autoHighlight
              onKeyDown={(event) => {
                if (event.key === 'Enter' && allStations.length > 0) {
                  event.preventDefault();
                  const searchTerm = (event.target as HTMLInputElement).value.toLowerCase();
                  const filteredStations = allStations.filter(station => 
                    station.title.toLowerCase().includes(searchTerm) ||
                    station.subtitle.toLowerCase().includes(searchTerm) ||
                    station.stationInformation?.iataCode?.toLowerCase().includes(searchTerm)
                  );
                  if (filteredStations.length > 0) {
                    onChange(filteredStations[0]);
                    // Clear the input to show the selected value
                    (event.target as HTMLInputElement).blur();
                  }
                }
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={label === 'pickup' ? 'Pick-up branch' : 'Return branch'}
                  placeholder="Search by name, address or IATA code"
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
              renderOption={(props, station) => {
                const { key, ...otherProps } = props;
                return (
                  <li key={generateUniqueKey('station', station.id || station.title)} {...otherProps}>
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                      {getStationIcon(station)}
                      <Box>
                        <Typography variant="body1">
                          {station.title}
                          {searchMode === 'location' && (
                            <Typography 
                              component="span" 
                              sx={{ 
                                ml: 1,
                                color: 'text.secondary',
                                fontSize: '0.875rem',
                              }}
                            >
                              ({station.distance?.toFixed(1)} km)
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
            />
          )}
        </Grid>
      </Grid>
    );
  };

  return (
    <Box>
      {showWarning && (
        <Alert 
          severity="warning" 
          onClose={() => setShowWarning(false)}
          sx={{ mb: 2 }}
        >
          {warningMessage}
        </Alert>
      )}
      <Box sx={{ position: 'relative' }}>
        {(loading || !isLoaded) && <LoadingOverlay />}
        {renderSearchInput()}
      </Box>
    </Box>
  );
}; 