import { env } from '../config/env';

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  id_token?: string;
  expires_in: number;
  refresh_expires_in: number;
  token_type: string;
}

interface AuthConfig {
  clientId: string;
  clientSecret: string;
  environment: 'stage' | 'production';
}

export class AuthService {
  private readonly tokenEndpoints = env.auth.endpoints;
  private accessToken: string | null = null;
  private tokenExpirationTime: number | null = null;

  constructor(private readonly config: AuthConfig) {}

  private get tokenEndpoint(): string {
    return this.tokenEndpoints[this.config.environment].token;
  }

  private get logoutEndpoint(): string {
    return this.tokenEndpoints[this.config.environment].logout;
  }

  private getBasicAuthHeader(): string {
    const credentials = `${this.config.clientId}:${this.config.clientSecret}`;
    return `Basic ${Buffer.from(credentials).toString('base64')}`;
  }

  async getAccessToken(): Promise<string> {
    // Return existing token if it's still valid (with 30s buffer)
    if (this.accessToken && this.tokenExpirationTime && Date.now() < this.tokenExpirationTime - 30000) {
      return this.accessToken;
    }

    try {
      const formData = new URLSearchParams();
      formData.append('grant_type', 'client_credentials');

      const response = await fetch(this.tokenEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': this.getBasicAuthHeader(),
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: formData.toString(),
        mode: 'cors',
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Auth Error Response:', error); // For debugging
        throw new Error(error.error_description || 'Failed to obtain access token');
      }

      const data: TokenResponse = await response.json();
      this.accessToken = data.access_token;
      this.tokenExpirationTime = Date.now() + (data.expires_in * 1000);

      return this.accessToken;
    } catch (error) {
      console.error('Auth Error:', error); // For debugging
      throw new Error(`Authentication failed: ${error instanceof Error ? error.message : 'Failed to fetch'}`);
    }
  }

  async logout(refreshToken: string): Promise<void> {
    try {
      const response = await fetch(this.logoutEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          refresh_token: refreshToken,
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
        }).toString()
      });

      if (!response.ok) {
        throw new Error('Logout failed');
      }

      this.accessToken = null;
      this.tokenExpirationTime = null;
    } catch (error) {
      throw new Error(`Logout failed: ${error.message}`);
    }
  }
} 