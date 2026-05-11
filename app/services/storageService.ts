const KEYS = {
  TOKEN: 'sel:token',
  TOKEN_EXPIRY: 'sel:tokenExpiry',
  USERNAME: 'sel:username',
  SERVER_URL: 'sel:serverUrl',
} as const

export const storageService = {
  // Auth token
  getToken(): string | null {
    return localStorage.getItem(KEYS.TOKEN)
  },
  setToken(token: string): void {
    localStorage.setItem(KEYS.TOKEN, token)
  },
  getTokenExpiry(): number | null {
    const val = localStorage.getItem(KEYS.TOKEN_EXPIRY)
    return val !== null ? Number(val) : null
  },
  setTokenExpiry(expiry: number): void {
    localStorage.setItem(KEYS.TOKEN_EXPIRY, String(expiry))
  },
  clearAuth(): void {
    localStorage.removeItem(KEYS.TOKEN)
    localStorage.removeItem(KEYS.TOKEN_EXPIRY)
  },

  // Saved credentials (for pre-populating login form)
  getUsername(): string | null {
    return localStorage.getItem(KEYS.USERNAME)
  },
  setUsername(username: string): void {
    localStorage.setItem(KEYS.USERNAME, username)
  },
  getServerUrl(): string | null {
    return localStorage.getItem(KEYS.SERVER_URL)
  },
  setServerUrl(url: string): void {
    localStorage.setItem(KEYS.SERVER_URL, url)
  },
  clearCredentials(): void {
    localStorage.removeItem(KEYS.USERNAME)
    localStorage.removeItem(KEYS.SERVER_URL)
  },
}
