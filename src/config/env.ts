export const env = {
  auth: {
    endpoints: {
      stage: {
        token: '/auth/realms/External/protocol/openid-connect/token',
        logout: '/auth/realms/External/protocol/openid-connect/logout'
      },
      production: {
        token: 'https://identity.orange.sixt.com/auth/realms/External/protocol/openid-connect/token',
        logout: 'https://identity.orange.sixt.com/auth/realms/External/protocol/openid-connect/logout'
      }
    }
  },
  api: {
    baseUrl: {
      stage: 'https://api.stage.mobility.sixt.com/v1',
      production: 'https://api.mobility.sixt.com/v1'
    }
  }
}; 