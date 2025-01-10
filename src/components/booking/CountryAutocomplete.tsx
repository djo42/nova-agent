import { Autocomplete, TextField, CircularProgress } from '@mui/material';
import { useState, useMemo } from 'react';
import { Country } from '../../types/booking';

interface CountryAutocompleteProps {
  options: Country[];
  value: Country | null;
  onChange: (country: Country | null) => void;
  label: string;
  loading?: boolean;
  error?: string | null;
  disabled?: boolean;
}

export const CountryAutocomplete = ({
  options,
  value,
  onChange,
  label,
  loading = false,
  error = null,
  disabled = false
}: CountryAutocompleteProps) => {
  const [inputValue, setInputValue] = useState('');
  const [open, setOpen] = useState(false);

  const filteredOptions = useMemo(() => {
    if (inputValue.length < 3) return [];
    return options.filter(option => 
      option.name.toLowerCase().includes(inputValue.toLowerCase()) ||
      option.iso2code.toLowerCase().includes(inputValue.toLowerCase())
    );
  }, [options, inputValue]);

  return (
    <Autocomplete
      value={value}
      onChange={(_, newValue) => onChange(newValue)}
      inputValue={inputValue}
      onInputChange={(_, newInputValue) => setInputValue(newInputValue)}
      options={filteredOptions}
      getOptionLabel={(option) => option.name}
      loading={loading}
      disabled={disabled}
      open={open && (loading || filteredOptions.length > 0)}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      noOptionsText={inputValue.length < 3 ? "Type at least 3 characters" : "No countries found"}
      filterOptions={(x) => x}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          error={!!error}
          helperText={error || (inputValue.length < 3 && inputValue.length > 0 ? "Type at least 3 characters" : undefined)}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading && <CircularProgress color="inherit" size={20} />}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
      renderOption={(props, option) => (
        <li {...props}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>{option.name}</span>
            <span style={{ color: 'gray', marginLeft: 8 }}>
              {option.iso2code}
            </span>
          </div>
        </li>
      )}
    />
  );
}; 