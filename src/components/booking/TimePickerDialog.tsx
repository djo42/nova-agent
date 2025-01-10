import { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogTitle,
  Box,
  Button,
  Grid,
  Typography,
} from '@mui/material';
import { Station } from '../../types/booking';

interface TimePickerDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (hours: number, minutes: number) => void;
  type: 'pickup' | 'return';
  station?: Station | null;
  selectedDate: Date | null;
}

interface OpeningHours {
  start: number;
  end: number;
  interval: number;
}

const DEFAULT_OPENING_HOURS: Record<'pickup' | 'return', OpeningHours> = {
  pickup: {
    start: 8,
    end: 18,
    interval: 30
  },
  return: {
    start: 7,
    end: 19,
    interval: 30
  }
};

const parseTimeString = (timeString: string): { hours: number; minutes: number } => {
  const [hours, minutes] = timeString.split(':').map(Number);
  return { hours, minutes };
};

const getStationOpeningHours = (station: Station | null, selectedDate: Date | null, type: 'pickup' | 'return'): OpeningHours => {
  if (!station?.stationInformation?.openingHours || !selectedDate) {
    return DEFAULT_OPENING_HOURS[type];
  }

  const openingHours = station.stationInformation.openingHours;

  // Check if station is open 24/7
  if (openingHours.open247) {
    return {
      start: 0,
      end: 23,
      interval: 30
    };
  }

  // Get day of week
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = days[selectedDate.getDay()];

  // Get opening hours for the selected day
  const dayOpenings = openingHours.days[dayName]?.openings?.[0];
  
  if (!dayOpenings) {
    return DEFAULT_OPENING_HOURS[type];
  }

  const openTime = parseTimeString(dayOpenings.open);
  const closeTime = parseTimeString(dayOpenings.close);

  // Check out-of-hours restrictions
  const outOfHours = openingHours.outOfHours?.[type];
  if (outOfHours?.type === 'not_allowed') {
    // If out-of-hours is not allowed, use the exact opening hours
    return {
      start: openTime.hours,
      end: closeTime.hours,
      interval: 30
    };
  }

  // If out-of-hours is allowed or not specified, use full day
  return {
    start: openTime.hours,
    end: closeTime.hours === 24 ? 23 : closeTime.hours,
    interval: 30
  };
};

const generateTimeSlots = (openingHours: OpeningHours) => {
  const slots = [];
  for (let hour = openingHours.start; hour <= openingHours.end; hour++) {
    for (let minute = 0; minute < 60; minute += openingHours.interval) {
      slots.push({ hours: hour, minutes: minute });
    }
  }
  // Remove last slot if it would exceed end time
  if (slots.length > 0 && slots[slots.length - 1].hours >= openingHours.end) {
    slots.pop();
  }
  return slots;
};

export const TimePickerDialog = ({
  open,
  onClose,
  onSelect,
  type,
  station,
  selectedDate,
}: TimePickerDialogProps) => {
  // Get opening hours based on station data
  const openingHours = getStationOpeningHours(station, selectedDate, type);
  const times = generateTimeSlots(openingHours);

  const formatTime = (hours: number, minutes: number) => {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Select {type === 'pickup' ? 'pick-up' : 'return'} time for {selectedDate?.toLocaleDateString()}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={1}>
          {times.map(({ hours, minutes }) => (
            <Grid item xs={3} key={`${hours}-${minutes}`}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => {
                  onSelect(hours, minutes);
                  onClose();
                }}
                sx={{
                  borderColor: '#ff5f00',
                  color: '#ff5f00',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 95, 0, 0.1)',
                    borderColor: '#ff5f00',
                  },
                }}
              >
                {formatTime(hours, minutes)}
              </Button>
            </Grid>
          ))}
        </Grid>
      </DialogContent>
    </Dialog>
  );
}; 