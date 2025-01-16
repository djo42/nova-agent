import { ApiClient } from './ApiClient';
import { Station } from '../types/common';

export class StationsService {
  private static apiClient = new ApiClient(process.env.NEXT_PUBLIC_SIXT_API_URL || '');

  static async getNearbyStations(lat: number, lng: number, radius: number): Promise<Station[]> {
    const latitude = Number(lat).toFixed(6);
    const longitude = Number(lng).toFixed(6);
    return await this.apiClient.request<Station[]>(
      `/stations/geo?latitude=${latitude}&longitude=${longitude}&maxDistance=${radius}&country=DE`
    );
  }

  static async getStationsByCountry(countryCode: string): Promise<Station[]> {
    return await this.apiClient.request<Station[]>(
      `/stations/country/${countryCode}`,
      {
        headers: {
          'Accept-Language': 'en-US'
        }
      }
    );
  }

  static async getCountries(): Promise<Country[]> {
    return await this.apiClient.request<Country[]>(
      '/stations/countries',
      {
        headers: {
          'Accept-Language': 'en-US'
        }
      }
    );
  }
} 