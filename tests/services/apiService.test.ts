import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Hoist mocks so they exist before module imports ───────────────────────────

const { mockGet, mockRequestUse, mockResponseUse, mockIsAxiosError } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockRequestUse: vi.fn(),
  mockResponseUse: vi.fn(),
  mockIsAxiosError: vi.fn((e: unknown) => Boolean((e as Record<string, unknown>)?.__isAxiosError)),
}))

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      get: mockGet,
      interceptors: {
        request: { use: mockRequestUse },
        response: { use: mockResponseUse },
      },
    })),
    isAxiosError: mockIsAxiosError,
  },
}))

// ── Imports after mocks ───────────────────────────────────────────────────────

import { SELApiService } from '~/services/apiService'

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeAxiosError(status: number, url = '/api/symbols', data: Record<string, unknown> = {}) {
  return {
    __isAxiosError: true,
    isAxiosError: true,
    response: { status, data },
    config: { url },
    message: 'Request failed',
    code: undefined,
  }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('SELApiService', () => {
  let service: SELApiService
  let requestInterceptor: (config: Record<string, unknown>) => Record<string, unknown>
  let responseErrorHandler: (error: unknown) => never
  let setItemSpy: ReturnType<typeof vi.spyOn>
  let removeItemSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.clearAllMocks()

    // Spy on localStorage so we can assert token persistence without the storageService wrapper
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null)
    setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {})
    removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {})

    // Capture interceptors when they are registered
    mockRequestUse.mockImplementation((fn: typeof requestInterceptor) => {
      requestInterceptor = fn
    })
    mockResponseUse.mockImplementation((_ok: unknown, errFn: typeof responseErrorHandler) => {
      responseErrorHandler = errFn
    })

    service = new SELApiService({ baseURL: '/', timeout: 10_000 })
  })

  // ── Token lifecycle ─────────────────────────────────────────────────────────

  describe('setToken / isTokenValid / clearToken', () => {
    it('isTokenValid returns false when no token is set', () => {
      expect(service.isTokenValid()).toBe(false)
    })

    it('isTokenValid returns true immediately after setToken', () => {
      service.setToken('tok', 3600)
      expect(service.isTokenValid()).toBe(true)
    })

    it('isTokenValid returns false when token is expired', () => {
      service.setToken('tok', -1) // already expired
      expect(service.isTokenValid()).toBe(false)
    })

    it('setToken persists to localStorage', () => {
      service.setToken('abc', 3600)
      expect(setItemSpy).toHaveBeenCalledWith('sel:token', 'abc')
      expect(setItemSpy).toHaveBeenCalledWith('sel:tokenExpiry', expect.any(String))
    })

    it('clearToken removes from memory and localStorage', () => {
      service.setToken('tok', 3600)
      service.clearToken()
      expect(service.isTokenValid()).toBe(false)
      expect(removeItemSpy).toHaveBeenCalledWith('sel:token')
      expect(removeItemSpy).toHaveBeenCalledWith('sel:tokenExpiry')
    })
  })

  // ── Authentication ──────────────────────────────────────────────────────────

  describe('authenticate', () => {
    it('returns true and stores token on success', async () => {
      mockGet.mockResolvedValueOnce({
        data: { AccessToken: 'tok-123', ExpiresIn: 3600, Scope: 'api', TokenType: 'Bearer' },
      })

      const result = await service.authenticate({
        serverUrl: 'https://192.168.3.2',
        username: 'testuser',
        password: 'testpass',
      })

      expect(result).toBe(true)
      expect(service.isTokenValid()).toBe(true)
      expect(setItemSpy).toHaveBeenCalledWith('sel:token', 'tok-123')
    })

    it('sends the correct Basic Auth header', async () => {
      mockGet.mockResolvedValueOnce({
        data: { AccessToken: 't', ExpiresIn: 3600, Scope: 'api', TokenType: 'Bearer' },
      })

      await service.authenticate({ serverUrl: 'https://test', username: 'u', password: 'p' })

      const [, callOptions] = mockGet.mock.calls[0]!
      expect(callOptions.headers.Authorization).toBe(`Basic ${btoa('u:p')}`)
    })

    it('rejects and does NOT store the token on auth failure', async () => {
      mockGet.mockRejectedValueOnce(makeAxiosError(401, '/api/auth/token'))

      await expect(
        service.authenticate({ serverUrl: 'https://test', username: 'bad', password: 'bad' }),
      ).rejects.toBeTruthy()

      expect(service.isTokenValid()).toBe(false)
      expect(setItemSpy).not.toHaveBeenCalledWith('sel:token', expect.anything())
    })
  })

  // ── Symbols ─────────────────────────────────────────────────────────────────

  describe('getSymbols', () => {
    it('filters to INS type only', async () => {
      mockGet.mockResolvedValueOnce({
        data: [
          { Name: 'AnalogDeadband', Type: 'INS', Description: 'Deadband' },
          { Name: 'SystemStatus', Type: 'BOOL', Description: 'Bool' },
          { Name: 'AlarmCount', Type: 'INT', Description: 'Int' },
        ],
      })

      const symbols = await service.getSymbols()
      expect(symbols).toHaveLength(1)
      expect(symbols[0]!.name).toBe('AnalogDeadband')
    })

    it('maps PascalCase API fields to camelCase', async () => {
      mockGet.mockResolvedValueOnce({
        data: [{ Name: 'FlowRate', Type: 'INS', Description: 'Flow' }],
      })

      const [sym] = await service.getSymbols()
      expect(sym).toEqual({ name: 'FlowRate', type: 'INS', description: 'Flow' })
    })

    it('passes sort and limit query params', async () => {
      mockGet.mockResolvedValueOnce({ data: [] })

      await service.getSymbols({ sort: 'asc', limit: 50 })

      expect(mockGet).toHaveBeenCalledWith('/api/symbols', {
        params: { sort: 'asc', limit: 50 },
      })
    })
  })

  describe('getSymbolValue', () => {
    it('returns a correctly shaped SymbolValue', async () => {
      const now = new Date().toISOString()
      mockGet.mockResolvedValueOnce({
        data: {
          stVal: 42,
          q: { validity: 'good' },
          t: { value: now },
          range: 'normal',
          units: 'mV',
          multiplier: 1.0,
          d: 'Test symbol',
        },
      })

      const val = await service.getSymbolValue('AnalogDeadband')
      expect(val.symbolName).toBe('AnalogDeadband')
      expect(val.stVal).toBe(42)
      expect(val.t).toBe(now)
      expect(val.lastUpdated).toBeInstanceOf(Date)
      expect(val.rawData).toBeDefined()
    })
  })

  // ── Interceptors ─────────────────────────────────────────────────────────────

  describe('request interceptor', () => {
    it('injects Bearer token when token is valid', () => {
      service.setToken('test-bearer', 3600)

      const config = { headers: {} as Record<string, string> }
      const result = requestInterceptor(config)

      expect((result.headers as Record<string, string>).Authorization).toBe('Bearer test-bearer')
    })

    it('does not overwrite an existing Authorization header', () => {
      service.setToken('test-bearer', 3600)

      const config = { headers: { Authorization: 'Basic xyz' } as Record<string, string> }
      const result = requestInterceptor(config)

      expect((result.headers as Record<string, string>).Authorization).toBe('Basic xyz')
    })

    it('does not inject token when no valid token exists', () => {
      const config = { headers: {} as Record<string, string> }
      const result = requestInterceptor(config)

      expect((result.headers as Record<string, string>).Authorization).toBeUndefined()
    })
  })

  describe('response error interceptor', () => {
    it('clears token on 401 for non-auth endpoints', () => {
      service.setToken('tok', 3600)
      vi.stubGlobal('location', { replace: vi.fn() })

      mockIsAxiosError.mockReturnValueOnce(true)
      expect(() => responseErrorHandler(makeAxiosError(401, '/api/symbols'))).toThrow()

      expect(service.isTokenValid()).toBe(false)
      expect(removeItemSpy).toHaveBeenCalledWith('sel:token')

      vi.unstubAllGlobals()
    })

    it('does NOT redirect for 401 on the auth endpoint itself', () => {
      const mockReplace = vi.fn()
      vi.stubGlobal('location', { replace: mockReplace })
      mockIsAxiosError.mockReturnValueOnce(true)

      expect(() =>
        responseErrorHandler(makeAxiosError(401, '/api/auth/token')),
      ).toThrow()

      expect(mockReplace).not.toHaveBeenCalled()
      vi.unstubAllGlobals()
    })

    it('converts network errors to a user-friendly message', () => {
      mockIsAxiosError.mockReturnValueOnce(true)
      const error = { __isAxiosError: true, isAxiosError: true, code: 'ERR_NETWORK', config: { url: '/api/symbols' } }

      expect(() => responseErrorHandler(error)).toThrowError(
        expect.objectContaining({ message: 'Network connection failed' }),
      )
    })

    it('converts timeout errors to a user-friendly message', () => {
      mockIsAxiosError.mockReturnValueOnce(true)
      const error = { __isAxiosError: true, isAxiosError: true, code: 'ECONNABORTED', config: { url: '/api/symbols' } }

      expect(() => responseErrorHandler(error)).toThrowError(
        expect.objectContaining({ message: 'Request timed out' }),
      )
    })
  })
})
