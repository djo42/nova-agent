interface StoredToken {
  accessToken: string;
  expiresAt: number;
}

export class TokenStore {
  private static token: StoredToken | null = null;

  static setToken(accessToken: string, expiresIn: number) {
    this.token = {
      accessToken,
      expiresAt: Date.now() + expiresIn * 1000,
    };
  }

  static getToken(): StoredToken | null {
    if (this.token && Date.now() < this.token.expiresAt - 30000) { // 30s buffer
      return this.token;
    }
    return null;
  }

  static clearToken() {
    this.token = null;
  }
} 