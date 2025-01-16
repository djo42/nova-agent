export interface SearchModes {
  pickup: SearchMode;
  return: SearchMode;
}

export type SearchMode = 'station' | 'location';

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

export interface Station {
  id: string;
  title: string;
  subtitle?: string;
  distance?: number;
  subtypes?: string[];
}

export interface PlaceOption {
  place_id: string;
  description: string;
} 