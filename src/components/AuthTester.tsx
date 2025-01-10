import { useState } from 'react';
import { AuthService } from '../services/AuthService';
import { env } from '../config/env';

export const AuthTester = () => {
  const [token, setToken] = useState<string>('');
  const [error, setError] = useState<string>('');

  const authService = new AuthService({
    clientId: process.env.NEXT_PUBLIC_CLIENT_ID!,
    clientSecret: process.env.NEXT_PUBLIC_CLIENT_SECRET!,
    environment: (process.env.NEXT_PUBLIC_ENVIRONMENT || 'stage') as 'stage' | 'production'
  });

  const handleGetToken = async () => {
    try {
      setError('');
      const accessToken = await authService.getAccessToken();
      setToken(accessToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get token');
    }
  };

  const handleLogout = async () => {
    try {
      setError('');
      await authService.logout(token);
      setToken('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to logout');
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Auth Tester</h1>
      
      <div className="space-x-4 mb-4">
        <button
          onClick={handleGetToken}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Get Token
        </button>
        
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          disabled={!token}
        >
          Logout
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Access Token:</label>
        <textarea
          value={token}
          readOnly
          className="w-full h-32 p-2 border rounded font-mono text-sm"
          placeholder="Token will appear here..."
        />
      </div>
    </div>
  );
}; 