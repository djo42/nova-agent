import { useState, useEffect } from 'react';
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

interface DateRange {
  start: Date | null;
  end: Date | null;
}

export const BookingMask = () => {
  const [formData, setFormData] = useState<BookingFormData>({
    pickupCountry: null,
    returnCountry: null,
    pickupStation: null,
    returnStation: null,
    pickupDate: null,
    returnDate: null,
  });
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

  const { countries, loading: countriesLoading, error: countriesError } = useCountries();

  const handleStationChange = (type: 'pickup' | 'return') => (station: Station | null) => {
    setFormData(prev => ({
      ...prev,
      [`${type}Station`]: station,
    }));
  };

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

  const handleDateSelect = (pickup: Date, returnDate: Date) => {
    // Store both dates in selectedDates
    setSelectedDates({
      pickup,
      return: returnDate
    });

    // Store pickup date for time picker and show pickup time dialog
    setTempDate(pickup);
    setReturnDateTemp(returnDate); // Store return date for later
    setTimePickerType('pickup');
    setTimePickerOpen(true);
    setDatePickerOpen(false); // Close date picker
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

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        borderRadius: 2,
        overflow: 'hidden',
        backgroundColor: 'white',
      }}
    >
      <Box sx={{ p: 2 }}>
        <Stack spacing={2}>
          {/* Vehicle Type Toggle */}
          <ToggleButtonGroup
            value={vehicleType}
            exclusive
            onChange={(_, value) => value && setVehicleType(value)}
            sx={{ mb: 2 }}
          >
            <ToggleButton 
              value="cars"
              sx={{ 
                px: 3,
                py: 1,
                '&.Mui-selected': {
                  backgroundColor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                },
              }}
            >
              <DirectionsCarIcon sx={{ mr: 1 }} />
              Cars
            </ToggleButton>
            <ToggleButton 
              value="trucks"
              sx={{ 
                px: 3,
                py: 1,
                '&.Mui-selected': {
                  backgroundColor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                },
              }}
            >
              <LocalShippingIcon sx={{ mr: 1 }} />
              Trucks
            </ToggleButton>
          </ToggleButtonGroup>

          {/* Location and Date Selection */}
          <Grid container spacing={2}>
            {/* Pickup Location */}
            <Grid item xs={12} md={3}>
              <StationAutocomplete
                value={formData.pickupStation}
                onChange={handleStationChange('pickup')}
                label="Pick-up location"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                placeholder="Airport, city or address"
              />
            </Grid>

            {/* Dates */}
            <Grid item xs={12} md={4}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Pick-up date"
                    value={formatDateTimeDisplay(pickupDate)}
                    onClick={() => setDatePickerOpen(true)}
                    InputProps={{
                      readOnly: true,
                      endAdornment: (
                        <InputAdornment position="end">
                          <CalendarTodayIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Return date"
                    value={formatDateTimeDisplay(returnDate)}
                    onClick={() => setDatePickerOpen(true)}
                    InputProps={{
                      readOnly: true,
                      endAdornment: (
                        <InputAdornment position="end">
                          <CalendarTodayIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              </Grid>
            </Grid>

            {/* Return Location */}
            <Grid item xs={12} md={3}>
              {differentReturnLocation ? (
                <StationAutocomplete
                  value={formData.returnStation}
                  onChange={handleStationChange('return')}
                  label="Return location"
                />
              ) : (
                <Button
                  onClick={() => setDifferentReturnLocation(true)}
                  sx={{ 
                    height: '56px', // Match height of TextField
                    width: '100%',
                    justifyContent: 'flex-start',
                    textTransform: 'none',
                    color: 'text.secondary',
                  }}
                >
                  + Different return location
                </Button>
              )}
            </Grid>

            {/* Search Button */}
            <Grid item xs={12} md={2}>
              <Button
                variant="contained"
                fullWidth
                sx={{ 
                  height: '56px', // Match height of TextField
                  backgroundColor: '#ff5f00',
                  '&:hover': {
                    backgroundColor: '#cc4c00',
                  },
                }}
              >
                Show cars
              </Button>
            </Grid>
          </Grid>
        </Stack>
      </Box>

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
  );
}; 