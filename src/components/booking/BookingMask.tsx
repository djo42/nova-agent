import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Box, 
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  Button,
  Stack,
  InputAdornment,
  Grid,
  TextField,
  Alert,
  Snackbar,
  Tabs,
  Tab,
  Checkbox,
  FormControlLabel,
  Typography,
} from '@mui/material';
import { StationAutocomplete } from './StationAutocomplete';
import { Country, Station, BookingFormData } from '../../types/booking';
import { useCountries } from '../../hooks/useCountries';
import { CustomDateTimePicker } from './CustomDateTimePicker';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import SearchIcon from '@mui/icons-material/Search';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import dayjs from 'dayjs';
import { DateRangePicker } from './DateRangePicker';
import { format } from 'date-fns';
import { TimePickerDialog } from './TimePickerDialog';
import { LocationSearch } from './LocationSearch';
import ListIcon from '@mui/icons-material/List';
import PlaceIcon from '@mui/icons-material/Place';
import { ApiClient } from '../../services/ApiClient';
import { useRouter } from 'next/router';
import { OffersList } from '../offers/OffersList';

interface DateRange {
  start: Date | null;
  end: Date | null;
}

interface SearchModes {
  pickup: 'station' | 'location';
  return: 'station' | 'location';
}

const SIXT_ORANGE = '#ff5f00';
const SIXT_ORANGE_LIGHT = 'rgba(255, 95, 0, 0.1)';

const tabsStyles = {
  '& .MuiTabs-indicator': {
    backgroundColor: SIXT_ORANGE,
  },
  '& .MuiTab-root': {
    '&.Mui-selected': {
      color: SIXT_ORANGE,
    },
  },
};

interface OfferResponse {
  offers: Array<{
    id: string;
    title: string;
    vehicleGroupInfo: {
      groupInfo: {
        imageUrl: string;
        examples: string[];
        maxPassengers: number;
        doors: number;
        baggage: {
          bags: number;
          suitcases: number;
        };
      };
    };
    prices: {
      totalPrice: {
        amount: string;
        currency: string;
      };
    };
  }>;
}

const STORAGE_KEY = 'bookingFormData';

export const BookingMask = () => {
  const initialFormData = useMemo(() => {
    if (typeof window === 'undefined') return {
      pickupCountry: null,
      returnCountry: null,
      pickupStation: null,
      returnStation: null,
      pickupDate: null,
      returnDate: null,
    };

    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        ...parsed,
        pickupDate: parsed.pickupDate ? new Date(parsed.pickupDate) : null,
        returnDate: parsed.returnDate ? new Date(parsed.returnDate) : null,
      };
    }

    return {
      pickupCountry: null,
      returnCountry: null,
      pickupStation: null,
      returnStation: null,
      pickupDate: null,
      returnDate: null,
    };
  }, []);

  const [formData, setFormData] = useState(initialFormData);
  const [vehicleType, setVehicleType] = useState('cars');
  const [differentReturnLocation, setDifferentReturnLocation] = useState(false);
  const [pickupDate, setPickupDate] = useState<Date | null>(null);
  const [returnDate, setReturnDate] = useState<Date | null>(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const [timePickerType, setTimePickerType] = useState<'pickup' | 'return'>('pickup');
  const [tempDate, setTempDate] = useState<Date | null>(null);
  const [returnDateTemp, setReturnDateTemp] = useState<Date | null>(null);
  const [pickupDateTime, setPickupDateTime] = useState<Date | null>(null);
  const [returnDateTime, setReturnDateTime] = useState<Date | null>(null);
  const [selectedDates, setSelectedDates] = useState<{ pickup: Date | null; return: Date | null }>({
    pickup: null,
    return: null
  });
  const [showBranchWarning, setShowBranchWarning] = useState(false);
  const [searchModes, setSearchModes] = useState<SearchModes>({
    pickup: 'station',
    return: 'station'
  });
  const [differentDropoff, setDifferentDropoff] = useState(false);
  const [pickupLabel, setPickupLabel] = useState('Branch');
  const [returnLabel, setReturnLabel] = useState('Branch');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [offers, setOffers] = useState<OfferResponse | null>(null);
  const [isLoadingOffers, setIsLoadingOffers] = useState(false);
  const [offerError, setOfferError] = useState<string | null>(null);
  const [showOffers, setShowOffers] = useState(false);

  const { countries, loading: countriesLoading, error: countriesError } = useCountries();
  const router = useRouter();

  const handleDatePickerOpen = (type: 'pickup' | 'return') => {
    setDatePickerOpen(true);
  };

  const handlePickupDateChange = (date: Date | null) => {
    setPickupDate(date);
    // If return date is before new pickup date, reset it
    if (returnDate && date && returnDate < date) {
      setReturnDate(null);
    }
  };

  const handleTimeSelect = (hours: number, minutes: number) => {
    if (!tempDate) return;

    if (timePickerType === 'pickup') {
      // Handle pickup time selection
      const newPickupDate = new Date(tempDate);
      newPickupDate.setHours(hours, minutes, 0);
      setPickupDateTime(newPickupDate);
      
      // Immediately proceed to return time selection
      if (returnDateTemp) {
        setTimeout(() => {
          setTempDate(returnDateTemp);
          setTimePickerType('return');
          setTimePickerOpen(true);
        }, 100); // Small delay to ensure smooth transition
      }
    } else {
      // Handle return time selection
      const newReturnDate = new Date(tempDate);
      newReturnDate.setHours(hours, minutes, 0);
      setReturnDateTime(newReturnDate);
      setTimePickerOpen(false);
    }
  };

  // Update pickup date display whenever either date or time changes
  useEffect(() => {
    if (selectedDates.pickup) {
      const date = new Date(selectedDates.pickup);
      if (pickupDateTime) {
        date.setHours(pickupDateTime.getHours(), pickupDateTime.getMinutes(), 0);
      }
      setPickupDate(date);
    }
  }, [selectedDates.pickup, pickupDateTime]);

  // Update return date display whenever either date or time changes
  useEffect(() => {
    if (selectedDates.return) {
      const date = new Date(selectedDates.return);
      if (returnDateTime) {
        date.setHours(returnDateTime.getHours(), returnDateTime.getMinutes(), 0);
      }
      setReturnDate(date);
    }
  }, [selectedDates.return, returnDateTime]);

  // Format display for the text fields
  const formatDateTimeDisplay = (date: Date | null) => {
    if (!date) return '';
    return format(date, 'MMM dd, HH:mm');
  };

  const handleDateFieldClick = () => {
    if (!formData.pickupStation) {
      setShowBranchWarning(true);
      return;
    }
    setDatePickerOpen(true);
  };

  const today = format(new Date(), 'MMM dd, HH:mm');

  // Add effect to sync return station with pickup station when checkbox is unchecked
  useEffect(() => {
    if (!differentReturnLocation) {
      setFormData(prev => ({
        ...prev,
        returnStation: prev.pickupStation
      }));
    }
  }, [differentReturnLocation, formData.pickupStation]);

  // Add effect to handle label changes
  useEffect(() => {
    if (differentDropoff) {
      setPickupLabel('Pick-up branch');
      setReturnLabel('Return branch');
    } else {
      setPickupLabel('Branch');
      setReturnLabel('Branch');
    }
  }, [differentDropoff]);

  const resetError = () => setErrorMessage(null);

  // Add error reset when changing search modes
  useEffect(() => {
    setErrorMessage(null);
  }, [searchModes]);

  const fetchOffers = useCallback(async () => {
    if (!formData.pickupStation?.id || !formData.returnStation?.id || !pickupDateTime || !returnDateTime) {
      setOfferError('Please select pickup and return locations and times');
      return;
    }

    try {
      setIsLoadingOffers(true);
      const apiClient = new ApiClient(process.env.NEXT_PUBLIC_SIXT_API_URL || '');

      const pickupDateStr = pickupDateTime.toLocaleString('sv', { 
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }).replace(' ', 'T');

      const returnDateStr = returnDateTime.toLocaleString('sv', { 
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }).replace(' ', 'T');

      const queryParams = new URLSearchParams({
        pickupStationId: formData.pickupStation.id,
        returnStationId: formData.returnStation.id,
        pickupDate: pickupDateStr,
        returnDate: returnDateStr,
        corporateCustomerNumber: ''
      }).toString();

      const response = await apiClient.request<OfferResponse>(`/offers?${queryParams}`);
      setOffers(response);
      setShowOffers(true);

    } catch (error) {
      console.error('Error fetching offers:', error);
      setOfferError('Failed to fetch offers');
    } finally {
      setIsLoadingOffers(false);
    }
  }, [formData.pickupStation, formData.returnStation, pickupDateTime, returnDateTime]);

  const handleBack = useCallback(() => {
    setShowOffers(false);
    router.push('/booking', undefined, { shallow: true });
  }, [router]);

  const handleStationChange = useCallback((type: 'pickup' | 'return') => (station: Station | null) => {
    setFormData(prev => ({
      ...prev,
      [`${type}Station`]: station,
    }));
  }, []);

  const handleDateSelect = useCallback((pickup: Date, returnDate: Date) => {
    setSelectedDates({
      pickup,
      return: returnDate
    });
    setTempDate(pickup);
    setReturnDateTemp(returnDate);
    setTimePickerType('pickup');
    setTimePickerOpen(true);
    setDatePickerOpen(false);
  }, []);

  // Add localStorage effect
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
  }, [formData]);

  // Add effect to initialize date/time states from stored data
  useEffect(() => {
    if (initialFormData.pickupDate) {
      setPickupDate(new Date(initialFormData.pickupDate));
      setPickupDateTime(new Date(initialFormData.pickupDate));
      setSelectedDates(prev => ({ ...prev, pickup: new Date(initialFormData.pickupDate) }));
    }
    if (initialFormData.returnDate) {
      setReturnDate(new Date(initialFormData.returnDate));
      setReturnDateTime(new Date(initialFormData.returnDate));
      setSelectedDates(prev => ({ ...prev, return: new Date(initialFormData.returnDate) }));
    }
  }, [initialFormData]);

  return (
    <>
      {/* Booking Mask Container */}
      <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Box sx={{ width: '100%', mb: showOffers ? 4 : 0 }}>
          {errorMessage && (
            <Box 
              sx={{ 
                width: '100%',
                backgroundColor: '#fff3cd',
                borderBottom: '1px solid #ffeeba',
                mb: 3,
              }}
            >
              <Alert 
                severity="warning" 
                onClose={resetError}
                sx={{ 
                  maxWidth: '1200px',
                  margin: '0 auto',
                  borderRadius: 2,
                  '& .MuiAlert-message': {
                    width: '100%',
                  },
                }}
              >
                {errorMessage}
              </Alert>
            </Box>
          )}
          <Paper 
            elevation={3} 
            sx={{ 
              borderRadius: 2,
              overflow: 'hidden',
              backgroundColor: 'white',
              width: '100%',
              maxWidth: { xs: '600px', md: '1200px' },
              margin: '0 auto',
              '& .MuiOutlinedInput-root': {
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: SIXT_ORANGE,
                },
                '&:hover': {
                  '& ~ .MuiFormLabel-root': {
                    color: SIXT_ORANGE,
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: SIXT_ORANGE,
                  },
                },
              },
              '& .MuiFormLabel-root.Mui-focused': {
                color: SIXT_ORANGE,
              },
              '& .MuiButton-root:not(.MuiButton-contained):hover': {
                borderColor: SIXT_ORANGE,
              },
            }}
          >
            <Box sx={{ p: { xs: 2, sm: 3 } }}>
              <Stack spacing={{ xs: 2, sm: 3 }}>
                {/* Vehicle Type Toggle */}
                <ToggleButtonGroup
                  value={vehicleType}
                  exclusive
                  onChange={(_, value) => value && setVehicleType(value)}
                  sx={{ 
                    width: '100%',
                    '& .MuiToggleButton-root': {
                      flex: 1,
                      py: 1.5,
                    }
                  }}
                >
                  <ToggleButton value="cars">
                    <DirectionsCarIcon sx={{ mr: 1 }} />
                    Cars
                  </ToggleButton>
                  <ToggleButton value="trucks">
                    <LocalShippingIcon sx={{ mr: 1 }} />
                    Trucks
                  </ToggleButton>
                </ToggleButtonGroup>

                {/* Mobile Layout */}
                <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                  <Stack spacing={2}>
                    {/* Pickup Location */}
                    <Box>
                      <Tabs
                        value={searchModes.pickup}
                        onChange={(_, value) => {
                          setSearchModes(prev => ({ ...prev, pickup: value }));
                          setFormData(prev => ({ ...prev, pickupStation: null }));
                        }}
                        sx={{ mb: 2, ...tabsStyles }}
                      >
                        <Tab 
                          icon={<ListIcon />} 
                          label="Station List" 
                          value="station"
                          iconPosition="start"
                        />
                        <Tab 
                          icon={<PlaceIcon />} 
                          label="Location Search" 
                          value="location"
                          iconPosition="start"
                        />
                      </Tabs>
                      <LocationSearch
                        value={formData.pickupStation}
                        onChange={handleStationChange('pickup')}
                        label="pickup"
                        searchMode={searchModes.pickup}
                        placeholder="Airport, city or address"
                        onError={setErrorMessage}
                      />
                    </Box>

                    {/* Return Location Checkbox */}
                    <FormControlLabel
                      control={
                        <Checkbox 
                          checked={differentDropoff}
                          onChange={(e) => setDifferentDropoff(e.target.checked)}
                          sx={{
                            color: SIXT_ORANGE,
                            '&.Mui-checked': {
                              color: SIXT_ORANGE,
                            },
                          }}
                        />
                      }
                      label="Return at different branch"
                    />

                    {/* Return Location */}
                    {differentDropoff && (
                      <Box>
                        <Tabs
                          value={searchModes.return}
                          onChange={(_, value) => {
                            setSearchModes(prev => ({ ...prev, return: value }));
                            setFormData(prev => ({ ...prev, returnStation: null }));
                          }}
                          sx={{ mb: 2, ...tabsStyles }}
                        >
                          <Tab 
                            icon={<ListIcon />} 
                            label="Station List" 
                            value="station"
                            iconPosition="start"
                          />
                          <Tab 
                            icon={<PlaceIcon />} 
                            label="Location Search" 
                            value="location"
                            iconPosition="start"
                          />
                        </Tabs>
                        <LocationSearch
                          value={formData.returnStation}
                          onChange={handleStationChange('return')}
                          label="return"
                          searchMode={searchModes.return}
                          placeholder="Airport, city or address"
                          onError={setErrorMessage}
                        />
                      </Box>
                    )}

                    {/* Date Fields */}
                    <TextField
                      fullWidth
                      label="Pick-up date & time"
                      placeholder={today}
                      value={formatDateTimeDisplay(pickupDate)}
                      onClick={handleDateFieldClick}
                      InputProps={{
                        readOnly: true,
                        endAdornment: (
                          <InputAdornment position="end">
                            <CalendarTodayIcon />
                          </InputAdornment>
                        ),
                      }}
                      InputLabelProps={{
                        shrink: true,
                      }}
                    />
                    <TextField
                      fullWidth
                      label="Return date & time"
                      placeholder={today}
                      value={formatDateTimeDisplay(returnDate)}
                      onClick={handleDateFieldClick}
                      InputProps={{
                        readOnly: true,
                        endAdornment: (
                          <InputAdornment position="end">
                            <CalendarTodayIcon />
                          </InputAdornment>
                        ),
                      }}
                      InputLabelProps={{
                        shrink: true,
                      }}
                    />
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={fetchOffers}
                      disabled={isLoadingOffers || !formData.pickupStation || !formData.returnStation || !pickupDateTime || !returnDateTime}
                      sx={{ 
                        height: '56px',
                        backgroundColor: SIXT_ORANGE,
                        '&:hover': {
                          backgroundColor: '#cc4c00',
                        },
                      }}
                    >
                      {isLoadingOffers ? 'Loading...' : 'Show cars'}
                    </Button>
                  </Stack>
                </Box>

                {/* Desktop Layout */}
                <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                  <Grid container spacing={2}>
                    {/* Location Fields Container */}
                    <Grid container item spacing={2}>
                      {/* Return Location Checkbox */}
                      <Grid item xs={12}>
                        <FormControlLabel
                          control={
                            <Checkbox 
                              checked={differentDropoff}
                              onChange={(e) => setDifferentDropoff(e.target.checked)}
                              sx={{
                                color: SIXT_ORANGE,
                                '&.Mui-checked': {
                                  color: SIXT_ORANGE,
                                },
                              }}
                            />
                          }
                          label="Return at different branch"
                        />
                      </Grid>

                      {/* Branch Fields Container */}
                      <Grid item xs={12}>
                        <Grid container spacing={2}>
                          {/* Pickup Location */}
                          <Grid item xs={12} md={differentDropoff ? 6 : 12}>
                            <Box>
                              <Tabs
                                value={searchModes.pickup}
                                onChange={(_, value) => {
                                  setSearchModes(prev => ({ ...prev, pickup: value }));
                                  setFormData(prev => ({ ...prev, pickupStation: null }));
                                }}
                                sx={{ mb: 2, ...tabsStyles }}
                              >
                                <Tab 
                                  icon={<ListIcon />} 
                                  label="Station List" 
                                  value="station"
                                  iconPosition="start"
                                />
                                <Tab 
                                  icon={<PlaceIcon />} 
                                  label="Location Search" 
                                  value="location"
                                  iconPosition="start"
                                />
                              </Tabs>
                              <LocationSearch
                                value={formData.pickupStation}
                                onChange={handleStationChange('pickup')}
                                label="pickup"
                                searchMode={searchModes.pickup}
                                placeholder="Airport, city or address"
                                onError={setErrorMessage}
                              />
                            </Box>
                          </Grid>

                          {/* Return Location */}
                          {differentDropoff && (
                            <Grid item xs={12} md={6}>
                              <Box>
                                <Tabs
                                  value={searchModes.return}
                                  onChange={(_, value) => {
                                    setSearchModes(prev => ({ ...prev, return: value }));
                                    setFormData(prev => ({ ...prev, returnStation: null }));
                                  }}
                                  sx={{ mb: 2, ...tabsStyles }}
                                >
                                  <Tab 
                                    icon={<ListIcon />} 
                                    label="Station List" 
                                    value="station"
                                    iconPosition="start"
                                  />
                                  <Tab 
                                    icon={<PlaceIcon />} 
                                    label="Location Search" 
                                    value="location"
                                    iconPosition="start"
                                  />
                                </Tabs>
                                <LocationSearch
                                  value={formData.returnStation}
                                  onChange={handleStationChange('return')}
                                  label="return"
                                  searchMode={searchModes.return}
                                  placeholder="Airport, city or address"
                                  onError={setErrorMessage}
                                />
                              </Box>
                            </Grid>
                          )}
                        </Grid>
                      </Grid>
                    </Grid>

                    {/* Date Fields and Search Button */}
                    <Grid container item spacing={2}>
                      <Grid item xs={8}>
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <TextField
                              fullWidth
                              label="Pick-up date & time"
                              placeholder={today}
                              value={formatDateTimeDisplay(pickupDate)}
                              onClick={handleDateFieldClick}
                              InputProps={{
                                readOnly: true,
                                endAdornment: (
                                  <InputAdornment position="end">
                                    <CalendarTodayIcon />
                                  </InputAdornment>
                                ),
                              }}
                              InputLabelProps={{
                                shrink: true,
                              }}
                            />
                          </Grid>
                          <Grid item xs={6}>
                            <TextField
                              fullWidth
                              label="Return date & time"
                              placeholder={today}
                              value={formatDateTimeDisplay(returnDate)}
                              onClick={handleDateFieldClick}
                              InputProps={{
                                readOnly: true,
                                endAdornment: (
                                  <InputAdornment position="end">
                                    <CalendarTodayIcon />
                                  </InputAdornment>
                                ),
                              }}
                              InputLabelProps={{
                                shrink: true,
                              }}
                            />
                          </Grid>
                        </Grid>
                      </Grid>

                      {/* Search Button */}
                      <Grid item xs={4}>
                        <Button
                          variant="contained"
                          fullWidth
                          onClick={fetchOffers}
                          disabled={isLoadingOffers || !formData.pickupStation || !formData.returnStation || !pickupDateTime || !returnDateTime}
                          sx={{ 
                            height: '56px',
                            backgroundColor: SIXT_ORANGE,
                            '&:hover': {
                              backgroundColor: '#cc4c00',
                            },
                          }}
                        >
                          {isLoadingOffers ? 'Loading...' : 'Show cars'}
                        </Button>
                      </Grid>
                    </Grid>
                  </Grid>
                </Box>
              </Stack>
            </Box>

            {/* Warning Snackbar */}
            <Snackbar 
              open={showBranchWarning} 
              autoHideDuration={4000} 
              onClose={() => setShowBranchWarning(false)}
              anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
              <Alert 
                onClose={() => setShowBranchWarning(false)} 
                severity="warning"
                sx={{ width: '100%' }}
              >
                Please select a pick-up location first
              </Alert>
            </Snackbar>

            <DateRangePicker
              open={datePickerOpen}
              onClose={() => setDatePickerOpen(false)}
              onSelect={handleDateSelect}
              initialPickupDate={pickupDate}
              initialReturnDate={returnDate}
            />

            <TimePickerDialog
              open={timePickerOpen}
              onClose={() => setTimePickerOpen(false)}
              onSelect={handleTimeSelect}
              type={timePickerType}
              station={timePickerType === 'pickup' ? formData.pickupStation : formData.returnStation}
              selectedDate={tempDate}
            />
          </Paper>
        </Box>
      </Box>

      {/* Separate Offers Container */}
      {showOffers && (
        <div> {/* Using div to avoid MUI Box styling */}
          <Box sx={{ maxWidth: '1200px', mx: 'auto', mt: 10 }}>
            <Typography variant="h5" sx={{ py: 3 }}>Available Vehicles</Typography>
            <Grid container spacing={3}>
              {offers?.offers.map((offer) => (
                <Grid item xs={12} md={6} lg={4} key={offer.id}>
                  <Paper 
                    elevation={2}
                    sx={{ 
                      p: 2,
                      borderRadius: 2,
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      border: 'none'
                    }}
                  >
                    <Box sx={{ position: 'relative', pb: '56.25%', mb: 2 }}>
                      <img
                        src={offer.vehicleGroupInfo.groupInfo.imageUrl}
                        alt={offer.title}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          borderRadius: 8,
                        }}
                      />
                    </Box>
                    <Typography variant="h6" gutterBottom>
                      {offer.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {offer.vehicleGroupInfo.groupInfo.examples.join(' or ')}
                    </Typography>
                    <Box sx={{ mt: 'auto', pt: 2 }}>
                      <Typography variant="h5" color={SIXT_ORANGE}>
                        {offer.prices.totalPrice.amount} {offer.prices.totalPrice.currency}
                      </Typography>
                      <Button 
                        variant="contained"
                        fullWidth
                        sx={{ 
                          mt: 2,
                          backgroundColor: SIXT_ORANGE,
                          '&:hover': {
                            backgroundColor: '#cc4c00',
                          },
                        }}
                      >
                        Book now
                      </Button>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        </div>
      )}

      {/* Dialogs */}
      <DateRangePicker
        open={datePickerOpen}
        onClose={() => setDatePickerOpen(false)}
        onSelect={handleDateSelect}
        initialPickupDate={pickupDate}
        initialReturnDate={returnDate}
      />
      <TimePickerDialog
        open={timePickerOpen}
        onClose={() => setTimePickerOpen(false)}
        onSelect={handleTimeSelect}
        type={timePickerType}
        station={timePickerType === 'pickup' ? formData.pickupStation : formData.returnStation}
        selectedDate={tempDate}
      />
      <Snackbar
        open={showBranchWarning}
        autoHideDuration={4000}
        onClose={() => setShowBranchWarning(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setShowBranchWarning(false)}
          severity="warning"
          sx={{ width: '100%' }}
        >
          Please select a pick-up location first
        </Alert>
      </Snackbar>
    </>
  );
}; 