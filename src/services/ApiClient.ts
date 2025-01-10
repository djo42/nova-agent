import { AuthService } from './AuthService';

export class ApiClient {
  constructor(
    private readonly authService: AuthService,
    private readonly baseUrl: string
  ) {}

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const accessToken = await this.authService.getAccessToken();

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error_description || 'API request failed');
    }

    return response.json();
  }
} 