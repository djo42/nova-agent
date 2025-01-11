import { env } from './config/env';
import { AuthService } from './services/AuthService';
import { ApiClient } from './services/ApiClient';

const authConfig = {
  clientId: process.env.CLIENT_ID!,
  clientSecret: process.env.CLIENT_SECRET!,
  environment: (process.env.ENVIRONMENT || 'stage') as 'stage' | 'production'
};

const authService = new AuthService(authConfig);
const apiClient = new ApiClient('/api');

// Example usage
async function main() {
  try {
    // Make an API request
    const response = await apiClient.request('/foo');
    console.log(response);

    // Logout (if you have a refresh token)
    // await authService.logout(refreshToken);
  } catch (error) {
    console.error('Error:', error.message);
  }
} 