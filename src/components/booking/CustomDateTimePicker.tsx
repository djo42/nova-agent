import { useState } from 'react';
import { 
  Dialog,
  DialogContent,
  TextField,
  Button,
  Stack,
  Box,
  InputAdornment,
} from '@mui/material';
import { 
  DatePicker,
  TimePicker,
  LocalizationProvider,
} from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

interface CustomDateTimePickerProps {
  label: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  minDateTime?: Date;
}

export const CustomDateTimePicker = ({
  label,
  value,
  onChange,
  minDateTime,
}: CustomDateTimePickerProps) => {
  const [open, setOpen] = useState(false);
  const [tempDate, setTempDate] = useState<Dayjs | null>(value ? dayjs(value) : null);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleSave = () => {
    onChange(tempDate?.toDate() ?? null);
    handleClose();
  };

  return (
    <>
      <TextField
        label={label}
        value={value ? dayjs(value).format('MMM DD, HH:mm') : ''}
        onClick={handleOpen}
        InputProps={{
          readOnly: true,
          endAdornment: (
            <InputAdornment position="end">
              <CalendarTodayIcon />
            </InputAdornment>
          ),
        }}
      />

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogContent>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Stack spacing={3}>
              <DatePicker
                label="Select Date"
                value={tempDate}
                onChange={(newDate) => setTempDate(newDate)}
                minDate={minDateTime ? dayjs(minDateTime) : undefined}
                slotProps={{
                  textField: {
                    fullWidth: true,
                  },
                }}
              />
              
              <TimePicker
                label="Select Time"
                value={tempDate}
                onChange={(newTime) => setTempDate(newTime)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                  },
                }}
                minutesStep={15}
                ampm={false}
                views={['hours', 'minutes']}
              />

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                <Button onClick={handleClose}>Cancel</Button>
                <Button 
                  variant="contained" 
                  onClick={handleSave}
                  disabled={!tempDate}
                >
                  Confirm
                </Button>
              </Box>
            </Stack>
          </LocalizationProvider>
        </DialogContent>
      </Dialog>
    </>
  );
}; 