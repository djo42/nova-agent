import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  Box, 
  Typography, 
  Button,
  Grid,
} from '@mui/material';
import { addMonths, format } from 'date-fns';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

interface DateRangePickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (pickup: Date, returnDate: Date) => void;
  initialPickupDate?: Date | null;
  initialReturnDate?: Date | null;
}

type SelectionState = 'pickup' | 'return' | 'complete';

const SIXT_ORANGE = '#ff5f00';
const SIXT_ORANGE_LIGHT = 'rgba(255, 95, 0, 0.2)';

export const DateRangePicker = ({
  open,
  onClose,
  onSelect,
  initialPickupDate,
  initialReturnDate,
}: DateRangePickerProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [pickupDate, setPickupDate] = useState<Date | null>(initialPickupDate || null);
  const [returnDate, setReturnDate] = useState<Date | null>(initialReturnDate || null);
  const [selectionState, setSelectionState] = useState<SelectionState>('pickup');
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);

  useEffect(() => {
    if (open) {
      setSelectionState('pickup');
      setPickupDate(initialPickupDate);
      setReturnDate(initialReturnDate);
      setCurrentMonth(new Date());
    }
  }, [open, initialPickupDate, initialReturnDate]);

  const handleDateClick = (date: Date) => {
    if (selectionState === 'pickup') {
      setPickupDate(date);
      setSelectionState('return');
    } else if (selectionState === 'return') {
      if (pickupDate && date < pickupDate) {
        setPickupDate(date);
        setReturnDate(pickupDate);
      } else {
        setReturnDate(date);
      }
      setSelectionState('complete');
      if (pickupDate) {
        onSelect(pickupDate, date);
        onClose();
      }
    }
  };

  const getMonthData = (baseDate: Date) => {
    const firstDay = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
    const days: Date[] = [];
    const daysInMonth = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0).getDate();

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(baseDate.getFullYear(), baseDate.getMonth(), i));
    }

    return { firstDay, days };
  };

  const isDateInRange = (date: Date) => {
    if (!pickupDate || (!returnDate && !hoveredDate)) return false;
    const end = returnDate || hoveredDate;
    return date > pickupDate && date < end!;
  };

  const renderMonth = (monthOffset: number) => {
    const monthDate = addMonths(currentMonth, monthOffset);
    const { days } = getMonthData(monthDate);
    const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    return (
      <Box>
        <Typography variant="h6" align="center" gutterBottom>
          {format(monthDate, 'MMMM yyyy')}
        </Typography>
        <Grid container spacing={0}>
          {weekDays.map(day => (
            <Grid item xs={12/7} key={day}>
              <Box sx={{ p: 1, textAlign: 'center' }}>
                <Typography variant="caption">{day}</Typography>
              </Box>
            </Grid>
          ))}
          {days.map(date => (
            <Grid item xs={12/7} key={date.toISOString()}>
              <Box
                sx={{
                  p: 1,
                  m: 0.2,
                  textAlign: 'center',
                  cursor: 'pointer',
                  borderRadius: 1,
                  bgcolor: (
                    (pickupDate && date.getTime() === pickupDate.getTime()) ||
                    (returnDate && date.getTime() === returnDate.getTime())
                  ) ? SIXT_ORANGE : isDateInRange(date) ? SIXT_ORANGE_LIGHT : 'transparent',
                  color: (
                    (pickupDate && date.getTime() === pickupDate.getTime()) ||
                    (returnDate && date.getTime() === returnDate.getTime())
                  ) ? 'white' : isDateInRange(date) ? SIXT_ORANGE : 'inherit',
                  '&:hover': {
                    bgcolor: SIXT_ORANGE,
                    color: 'white',
                  },
                }}
                onClick={() => handleDateClick(date)}
                onMouseEnter={() => selectionState === 'return' && setHoveredDate(date)}
                onMouseLeave={() => setHoveredDate(null)}
              >
                <Typography>
                  {date.getDate()}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogContent>
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            {selectionState === 'pickup' ? 'Select pickup date' : 'Select return date'}
          </Typography>
          <Grid container spacing={2}>
            {[0, 1, 2].map((offset) => (
              <Grid item xs={4} key={offset}>
                {renderMonth(offset)}
              </Grid>
            ))}
          </Grid>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
            <Button
              onClick={() => setCurrentMonth(prev => addMonths(prev, -1))}
              startIcon={<ChevronLeftIcon />}
            >
              Previous
            </Button>
            <Button
              onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}
              endIcon={<ChevronRightIcon />}
            >
              Next
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}; 