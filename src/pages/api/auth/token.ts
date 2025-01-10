import { NextApiRequest, NextApiResponse } from 'next';
import { AuthService } from '../../../services/AuthService';
import { TokenStore } from '../../../services/TokenStore';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check if we have a valid token
    const storedToken = TokenStore.getToken();
    if (storedToken) {
      return res.status(200).json({ accessToken: storedToken.accessToken });
    }

    // Get new token
    const authService = new AuthService({
      clientId: process.env.CLIENT_ID!,
      clientSecret: process.env.CLIENT_SECRET!,
      environment: (process.env.ENVIRONMENT || 'stage') as 'stage' | 'production'
    });

    const { accessToken, expiresIn } = await authService.getAccessToken();
    
    // Store the new token
    TokenStore.setToken(accessToken, expiresIn);

    res.status(200).json({ accessToken });
  } catch (error) {
    console.error('Token error:', error);
    res.status(500).json({ error: 'Failed to get access token' });
  }
};

export default handler; 