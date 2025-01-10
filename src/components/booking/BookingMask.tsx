import { useState } from 'react';
import { 
  Box, 
  Typography, 
  Autocomplete, 
  TextField, 
  Switch,
  FormControlLabel,
  Grid,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { StationAutocomplete } from './StationAutocomplete';
import { Country, Station, BookingFormData } from '../../types/booking';
import { useCountries } from '../../hooks/useCountries';

export const BookingMask = () => {
  const [formData, setFormData] = useState<BookingFormData>({
    pickupCountry: null,
    returnCountry: null,
    pickupStation: null,
    returnStation: null,
    pickupDate: null,
    returnDate: null,
  });
  const [differentReturnLocation, setDifferentReturnLocation] = useState(false);
  
  const { countries, loading: countriesLoading, error: countriesError } = useCountries();

  const handleCountryChange = (type: 'pickup' | 'return') => (country: Country | null) => {
    setFormData(prev => ({
      ...prev,
      [`${type}Country`]: country,
      [`${type}Station`]: null,
    }));
  };

  const handleStationChange = (type: 'pickup' | 'return') => (station: Station | null) => {
    setFormData(prev => ({
      ...prev,
      [`${type}Station`]: station,
    }));
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Book a Car
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={differentReturnLocation}
                onChange={(e) => setDifferentReturnLocation(e.target.checked)}
              />
            }
            label="Return to different location"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <Autocomplete
            options={countries}
            loading={countriesLoading}
            value={formData.pickupCountry}
            onChange={(_, value) => handleCountryChange('pickup')(value)}
            getOptionLabel={(option) => option.name}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Pickup Country"
                error={!!countriesError}
                helperText={countriesError}
              />
            )}
          />
        </Grid>

        {differentReturnLocation && (
          <Grid item xs={12} md={6}>
            <Autocomplete
              options={countries}
              loading={countriesLoading}
              value={formData.returnCountry}
              onChange={(_, value) => handleCountryChange('return')(value)}
              getOptionLabel={(option) => option.name}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Return Country"
                  error={!!countriesError}
                  helperText={countriesError}
                />
              )}
            />
          </Grid>
        )}

        <Grid item xs={12} md={6}>
          <StationAutocomplete
            countryCode={formData.pickupCountry?.iso2code ?? null}
            value={formData.pickupStation}
            onChange={handleStationChange('pickup')}
            label="Pickup Location"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <StationAutocomplete
            countryCode={differentReturnLocation 
              ? formData.returnCountry?.iso2code ?? null 
              : formData.pickupCountry?.iso2code ?? null}
            value={formData.returnStation}
            onChange={handleStationChange('return')}
            label="Return Location"
            disabled={!differentReturnLocation && !formData.pickupStation}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <DateTimePicker
            label="Pickup Date & Time"
            value={formData.pickupDate}
            onChange={(date) => setFormData(prev => ({ ...prev, pickupDate: date }))}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <DateTimePicker
            label="Return Date & Time"
            value={formData.returnDate}
            onChange={(date) => setFormData(prev => ({ ...prev, returnDate: date }))}
            minDateTime={formData.pickupDate ?? undefined}
          />
        </Grid>
      </Grid>
    </Box>
  );
}; 