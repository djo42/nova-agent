import { Station } from '../types/common';
import { STATION_TYPES } from '../constants';

export const sortAndGroupStations = (stations: Station[], sortByDistance: boolean = false) => {
  const groups = stations.reduce((acc, station) => {
    const subtypes = station.subtypes?.map(s => s.toLowerCase()) || [];
    
    if (subtypes.includes(STATION_TYPES.AIRPORT)) {
      acc.airports.push(station);
    } else if (subtypes.includes(STATION_TYPES.RAILWAY) || subtypes.includes(STATION_TYPES.TRAIN_STATION)) {
      acc.railways.push(station);
    } else {
      acc.others.push(station);
    }
    return acc;
  }, { airports: [] as Station[], railways: [] as Station[], others: [] as Station[] });

  const sortStations = (a: Station, b: Station) => {
    if (sortByDistance && a.distance !== undefined && b.distance !== undefined) {
      return a.distance - b.distance;
    }
    return (a.title || '').localeCompare(b.title || '');
  };

  Object.values(groups).forEach(group => group.sort(sortStations));

  return [...groups.airports, ...groups.railways, ...groups.others];
}; 