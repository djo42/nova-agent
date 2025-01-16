import { useState, useEffect } from 'react';
import { Station } from '../types/common';
import { StationsService } from '../services/StationsService';
import { sortAndGroupStations } from '../utils/stationUtils';

export const useStations = (countryCode?: string) => {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!countryCode) return;
    
    const fetchStations = async () => {
      try {
        setLoading(true);
        const stations = await StationsService.getStationsByCountry(countryCode);
        setStations(sortAndGroupStations(stations));
      } catch (error) {
        setError('Failed to fetch stations');
      } finally {
        setLoading(false);
      }
    };

    fetchStations();
  }, [countryCode]);

  return { stations, loading, error };
}; 