import axios, { type AxiosInstance, type AxiosError } from 'axios'
import { storage } from './storageService'
import type {
  AuthCredentials,
  AuthTokenResponse,
  Symbol,
  SymbolValue,
  ApiSymbol,
  ApiSymbolValue,
  ApiError,
} from '~/types/api'

const TOKEN_KEY = 'token'
const TOKEN_EXPIRY_KEY = 'tokenExpiry'

export interface ApiServiceConfig {
  baseURL: string
  timeout?: number
}

export class SELApiService {
  private token: string | null = null
  private tokenExpiry: number | null = null
  private readonly client: AxiosInstance

  constructor(config: ApiServiceConfig = { baseURL: '/', timeout: 10_000 }) {
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout ?? 10_000,
    })

    // Restore persisted session so refreshes don't log the user out
    this.token = storage.get(TOKEN_KEY)
    const expiry = storage.get(TOKEN_EXPIRY_KEY)
    this.tokenExpiry = expiry ? Number(expiry) : null

    this.setupInterceptors()
  }

  private setupInterceptors(): void {
    // Inject Bearer token on every request unless the caller already set Authorization
    this.client.interceptors.request.use((config) => {
      if (this.token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${this.token}`
      }
      return config
    })

    // Normalise all errors; redirect to /login on 401 for authenticated endpoints
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        const isAuthEndpoint = error.config?.url?.includes('/api/auth/token')
        if (error.response?.status === 401 && !isAuthEndpoint) {
          this.clearToken()
          window.location.replace('/login')
        }
        this.handleError(error)
      },
    )
  }

  // ── Authentication ──────────────────────────────────────────────────────────

  async authenticate(credentials: AuthCredentials): Promise<boolean> {
    const basic = btoa(`${credentials.username}:${credentials.password}`)
    const { data } = await this.client.get<AuthTokenResponse>('/api/auth/token', {
      headers: { Authorization: `Basic ${basic}` },
    })
    this.setToken(data.AccessToken, data.ExpiresIn)
    return true
  }

  setToken(token: string, expiresIn: number): void {
    this.token = token
    this.tokenExpiry = Date.now() + expiresIn * 1_000
    storage.set(TOKEN_KEY, token)
    storage.set(TOKEN_EXPIRY_KEY, String(this.tokenExpiry))
  }

  clearToken(): void {
    this.token = null
    this.tokenExpiry = null
    storage.remove(TOKEN_KEY)
    storage.remove(TOKEN_EXPIRY_KEY)
  }

  isTokenValid(): boolean {
    return !!this.token && this.tokenExpiry !== null && Date.now() < this.tokenExpiry
  }

  // ── Symbols ─────────────────────────────────────────────────────────────────

  async getSymbols(params?: { sort?: 'asc' | 'desc'; limit?: number }): Promise<Symbol[]> {
    const { data } = await this.client.get<ApiSymbol[]>('/api/symbols', { params })
    // Filter on the raw Type field BEFORE mapping to camelCase
    return data
      .filter((item) => item.Type === 'INS')
      .map((item) => ({
        name: item.Name,
        type: item.Type,
        description: item.Description,
      }))
  }

  async getSymbolValue(symbolName: string): Promise<SymbolValue> {
    const { data } = await this.client.get<ApiSymbolValue>(
      `/api/symbols/${encodeURIComponent(symbolName)}`,
    )
    return {
      symbolName,
      stVal: data.stVal,
      t: data.t.value,
      lastUpdated: new Date(),
      rawData: data as unknown as Record<string, unknown>,
    }
  }

  // ── Error handling ──────────────────────────────────────────────────────────

  private handleError(error: unknown): never {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status
      const responseData = error.response?.data as Record<string, unknown> | undefined
      const detail = (responseData?.detail ?? responseData?.message) as string | undefined

      const message =
        detail ??
        (error.code === 'ECONNABORTED' ? 'Request timed out' : undefined) ??
        (error.code === 'ERR_NETWORK' ? 'Network connection failed' : undefined) ??
        error.message ??
        'An unexpected error occurred'

      throw { message, status, timestamp: new Date() } satisfies ApiError
    }
    throw { message: 'An unexpected error occurred', timestamp: new Date() } satisfies ApiError
  }
}

// Singleton — import this everywhere instead of constructing a new instance
export const apiService = new SELApiService({ baseURL: '/', timeout: 10_000 })
