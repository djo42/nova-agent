import React, { createContext, useContext, useEffect, useState } from 'react';
import GoogleMapsLoader from '../services/GoogleMapsLoader';

interface GoogleMapsContextType {
  isLoaded: boolean;
  error: Error | null;
}

const GoogleMapsContext = createContext<GoogleMapsContextType>({
  isLoaded: false,
  error: null,
});

export const GoogleMapsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    GoogleMapsLoader.getInstance()
      .load()
      .then(() => setIsLoaded(true))
      .catch((err) => setError(err));
  }, []);

  return (
    <GoogleMapsContext.Provider value={{ isLoaded, error }}>
      {children}
    </GoogleMapsContext.Provider>
  );
};

export const useGoogleMaps = () => useContext(GoogleMapsContext); 