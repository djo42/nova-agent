import { useState, useEffect } from 'react';
import GoogleMapsLoader from '../services/GoogleMapsLoader';

interface PlacesAutocompleteOptions {
  requestOptions?: google.maps.places.AutocompletionRequest;
}

export const usePlacesAutocomplete = ({ requestOptions }: PlacesAutocompleteOptions = {}) => {
  const [service, setService] = useState<google.maps.places.AutocompleteService | null>(null);
  const [value, setValue] = useState('');
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize Google Maps
  useEffect(() => {
    let mounted = true;

    const initializeService = async () => {
      try {
        await GoogleMapsLoader.getInstance().load();
        
        if (mounted && window.google?.maps?.places) {
          const autocompleteService = new google.maps.places.AutocompleteService();
          setService(autocompleteService);
          setIsLoaded(true);
        }
      } catch (error) {
        console.error('Error initializing Google Maps:', error);
      }
    };

    initializeService();

    return () => {
      mounted = false;
    };
  }, []);

  // Handle suggestions
  useEffect(() => {
    if (!service || !value) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const results = await service.getPlacePredictions({
          input: value,
          ...requestOptions,
        });
        setSuggestions(results.predictions);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [value, service, requestOptions]);

  return {
    value,
    setValue,
    suggestions,
    clearSuggestions: () => setSuggestions([]),
    isLoaded,
  };
}; 