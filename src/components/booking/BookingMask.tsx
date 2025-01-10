import { useState } from 'react';
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
                  <CustomDateTimePicker
                    label="Pick-up date"
                    value={pickupDate}
                    onChange={setPickupDate}
                  />
                </Grid>
                <Grid item xs={6}>
                  <CustomDateTimePicker
                    label="Return date"
                    value={returnDate}
                    onChange={setReturnDate}
                    minDateTime={pickupDate ?? undefined}
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
    </Paper>
  );
}; 