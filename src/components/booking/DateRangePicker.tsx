import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  Box, 
  Typography, 
  Button,
  Grid,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { addMonths, format, getMonth } from 'date-fns';
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
type PickerMode = 'view' | 'selection';

const SIXT_ORANGE = '#ff5f00';
const SIXT_ORANGE_LIGHT = 'rgba(255, 95, 0, 0.2)';

const WEEKDAY_LABELS = {
  monday: 'Mo',
  tuesday: 'Tu',
  wednesday: 'We',
  thursday: 'Th',
  friday: 'Fr',
  saturday: 'Sa',
  sunday: 'Su'
};

const formatLocalDate = (date: Date) => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export const DateRangePicker = ({
  open,
  onClose,
  onSelect,
  initialPickupDate,
  initialReturnDate,
}: DateRangePickerProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [pickupDate, setPickupDate] = useState<Date | null>(initialPickupDate || null);
  const [returnDate, setReturnDate] = useState<Date | null>(initialReturnDate || null);
  const [selectionState, setSelectionState] = useState<SelectionState>('pickup');
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);
  const [container, setContainer] = useState<HTMLElement | undefined>(undefined);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [pickerMode, setPickerMode] = useState<PickerMode>('view');

  useEffect(() => {
    if (initialPickupDate && initialReturnDate) {
      setPickupDate(initialPickupDate);
      setReturnDate(initialReturnDate);
      setSelectedDates([
        formatLocalDate(initialPickupDate),
        formatLocalDate(initialReturnDate)
      ]);
      setPickerMode('view');
    }
  }, [initialPickupDate, initialReturnDate]);

  useEffect(() => {
    if (open) {
      if (initialPickupDate && initialReturnDate) {
        setPickerMode('view');
      } else {
        setPickerMode('selection');
        setSelectionState('pickup');
      }
      setCurrentMonth(initialPickupDate || new Date());
    }
  }, [open, initialPickupDate, initialReturnDate]);

  useEffect(() => {
    setContainer(document.body);
  }, []);

  useEffect(() => {
    console.log('Selected Dates:', selectedDates);
    console.log('Pickup Date:', pickupDate);
    console.log('Return Date:', returnDate);
    console.log('Mode:', pickerMode);
  }, [selectedDates, pickupDate, returnDate, pickerMode]);

  const handleDateClick = (date: Date) => {
    const dateStr = formatLocalDate(date);
    
    if (pickupDate && returnDate) {
      setPickupDate(date);
      setReturnDate(null);
      setSelectedDates([dateStr]);
      setSelectionState('return');
      setPickerMode('selection');
      return;
    }
    
    if (pickerMode === 'view') {
      setPickerMode('selection');
      setSelectionState('pickup');
      setPickupDate(date);
      setSelectedDates([dateStr]);
      return;
    }

    if (selectionState === 'pickup') {
      setPickupDate(date);
      setSelectedDates([dateStr]);
      setSelectionState('return');
    } else if (selectionState === 'return') {
      const firstDate = pickupDate!;
      const secondDate = date;
      
      if (firstDate.getTime() < secondDate.getTime()) {
        setPickupDate(firstDate);
        setReturnDate(secondDate);
        setSelectedDates([formatLocalDate(firstDate), formatLocalDate(secondDate)]);
      } else {
        setPickupDate(secondDate);
        setReturnDate(firstDate);
        setSelectedDates([formatLocalDate(secondDate), formatLocalDate(firstDate)]);
      }
      
      setSelectionState('complete');
      onSelect(
        firstDate.getTime() < secondDate.getTime() ? firstDate : secondDate,
        firstDate.getTime() < secondDate.getTime() ? secondDate : firstDate
      );
      onClose();
    }
  };

  const getMonthData = (baseDate: Date) => {
    const firstDay = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
    const days: Date[] = [];
    
    // Add empty slots for days before the first day of the month
    const firstDayOfWeek = firstDay.getDay();
    for (let i = 0; i < firstDayOfWeek; i++) {
      const prevDate = new Date(firstDay);
      prevDate.setDate(prevDate.getDate() - (firstDayOfWeek - i));
      days.push(prevDate);
    }

    // Add all days of the month
    const daysInMonth = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(baseDate.getFullYear(), baseDate.getMonth(), i));
    }

    // Add empty slots for days after the last day of the month
    const lastDay = new Date(baseDate.getFullYear(), baseDate.getMonth(), daysInMonth);
    const lastDayOfWeek = lastDay.getDay();
    for (let i = 1; i < 7 - lastDayOfWeek; i++) {
      const nextDate = new Date(lastDay);
      nextDate.setDate(nextDate.getDate() + i);
      days.push(nextDate);
    }

    return { firstDay, days };
  };

  const isDateSelected = (date: Date) => {
    const dateStr = formatLocalDate(date);
    return selectedDates.includes(dateStr);
  };

  const isDateInRange = (date: Date) => {
    if (pickupDate && returnDate) {
      const dateTime = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
      const startTime = new Date(pickupDate.getFullYear(), pickupDate.getMonth(), pickupDate.getDate()).getTime();
      const endTime = new Date(returnDate.getFullYear(), returnDate.getMonth(), returnDate.getDate()).getTime();
      
      return dateTime > Math.min(startTime, endTime) && dateTime < Math.max(startTime, endTime);
    }
    
    if (pickupDate && hoveredDate && selectionState === 'return') {
      const dateTime = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
      const startTime = new Date(pickupDate.getFullYear(), pickupDate.getMonth(), pickupDate.getDate()).getTime();
      const hoverTime = new Date(hoveredDate.getFullYear(), hoveredDate.getMonth(), hoveredDate.getDate()).getTime();
      
      return dateTime > Math.min(startTime, hoverTime) && dateTime < Math.max(startTime, hoverTime);
    }

    return false;
  };

  const renderMonth = (monthOffset: number) => {
    const monthDate = addMonths(currentMonth, monthOffset);
    const { days } = getMonthData(monthDate);
    const weekDays = [
      { key: 'sun', label: 'S' },
      { key: 'mon', label: 'M' },
      { key: 'tue', label: 'T' },
      { key: 'wed', label: 'W' },
      { key: 'thu', label: 'T' },
      { key: 'fri', label: 'F' },
      { key: 'sat', label: 'S' }
    ];

    return (
      <Box>
        <Typography variant="h6" align="center" gutterBottom>
          {format(monthDate, 'MMMM yyyy')}
        </Typography>
        <Grid container spacing={0}>
          {weekDays.map(({ key, label }) => (
            <Grid item xs={12/7} key={`weekday-${key}-${monthOffset}`}>
              <Box sx={{ p: 1, textAlign: 'center' }}>
                <Typography variant="caption">{label}</Typography>
              </Box>
            </Grid>
          ))}
          {days.map(date => {
            const isSelected = isDateSelected(date);
            const isInRange = !isSelected && isDateInRange(date);
            const isHovered = hoveredDate && date.getTime() === hoveredDate.getTime();
            const isCurrentMonth = date.getMonth() === monthDate.getMonth();

            // Skip rendering dates from other months
            if (!isCurrentMonth) {
              return <Grid item xs={12/7} key={date.toISOString()} />;
            }

            return (
              <Grid item xs={12/7} key={date.toISOString()}>
                <Box
                  sx={{
                    p: 1,
                    m: 0.2,
                    textAlign: 'center',
                    cursor: 'pointer',
                    borderRadius: 1,
                    bgcolor: isSelected ? SIXT_ORANGE : (isInRange || isHovered) ? SIXT_ORANGE_LIGHT : 'transparent',
                    color: isSelected ? 'white' : (isInRange || isHovered) ? SIXT_ORANGE : 'inherit',
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
            );
          })}
        </Grid>
      </Box>
    );
  };

  const getDialogTitle = () => {
    if (pickerMode === 'view') {
      return 'Selected date range';
    }
    return selectionState === 'pickup' ? 'Select pickup date' : 'Select return date';
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      disablePortal
      container={container}
      closeAfterTransition
      PaperProps={{
        sx: { 
          borderRadius: 2,
          m: isMobile ? 1 : 2,
          maxHeight: '90vh',
        },
        role: 'dialog',
        'aria-modal': true,
        tabIndex: -1
      }}
      sx={{
        '& .MuiBackdrop-root': {
          backgroundColor: 'rgba(0, 0, 0, 0.5)'
        }
      }}
      slotProps={{
        backdrop: {
          'aria-hidden': true
        }
      }}
    >
      <DialogContent>
        <Box sx={{ p: { xs: 1, sm: 2 } }}>
          <Typography variant="subtitle1" gutterBottom>
            {getDialogTitle()}
          </Typography>
          <Grid 
            container 
            spacing={2} 
            sx={{ 
              flexDirection: { xs: 'column', md: 'row' },
              '& > .MuiGrid-item': {
                width: { xs: '100%', md: 'auto' }
              }
            }}
          >
            {[0, 1, 2].map((offset) => (
              <Grid 
                item 
                xs={12} 
                md={4} 
                key={offset}
                sx={{
                  display: {
                    xs: offset === getMonth(currentMonth) ? 'block' : 'none',
                    md: 'block'
                  }
                }}
              >
                {renderMonth(offset)}
              </Grid>
            ))}
          </Grid>

          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            mt: 2,
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 1, sm: 0 }
          }}>
            {isMobile && (
              <Typography variant="body2" align="center" sx={{ mb: 1 }}>
                {format(currentMonth, 'MMMM yyyy')}
              </Typography>
            )}
            <Button
              onClick={() => setCurrentMonth(prev => addMonths(prev, -1))}
              startIcon={<ChevronLeftIcon />}
              fullWidth={isMobile}
            >
              Previous
            </Button>
            <Button
              onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}
              endIcon={<ChevronRightIcon />}
              fullWidth={isMobile}
            >
              Next
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}; 