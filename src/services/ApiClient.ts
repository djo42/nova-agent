import { AuthService } from './AuthService';

export class ApiClient {
  constructor(
    private readonly baseUrl: string
  ) {}

  private async getToken(): Promise<string> {
    const response = await fetch('/api/auth/token');
    if (!response.ok) {
      throw new Error('Failed to get access token');
    }
    const data = await response.json();
    return data.accessToken;
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const accessToken = await this.getToken();

    const requestOptions = Object.assign({}, options, {
      headers: Object.assign({}, options.headers, {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }),
    });

    const response = await fetch(`${this.baseUrl}${endpoint}`, requestOptions);

    if (!response.ok) {
      const text = await response.text();
      console.error('API Error:', {
        status: response.status,
        statusText: response.statusText,
        body: text
      });
      try {
        const error = JSON.parse(text);
        throw new Error(error.message || 'API request failed');
      } catch {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
    }

    return response.json();
  }
} 