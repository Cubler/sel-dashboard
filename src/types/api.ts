// Raw PascalCase shapes returned directly from the device API
export interface ApiSymbol {
  Name: string
  Type: string
  Description: string
}

export interface ApiDetailQual {
  overflow: boolean
  outOfRange: boolean
  badReference: boolean
  oscillatory: boolean
  failure: boolean
  oldData: boolean
  inconsistent: boolean
  inaccurate: boolean
}

export interface ApiQuality {
  validity: QualityValidity
  source: string
  test: boolean
  operatorBlocked: boolean
  detailQual: ApiDetailQual
}

export interface ApiTimestamp {
  value: string
  leapSecondsKnown: boolean
  clockFailure: boolean
  clockNotSynchronized: boolean
  timeAccuracy: number
  source: string
}

export interface ApiSymbolValue {
  stVal: number
  q: ApiQuality
  t: ApiTimestamp
  range: RangeStatus
  units: string
  multiplier: number
  d: string
}

// App-level camelCase types (mapped from API responses)
export interface Symbol {
  name: string
  type: string
  description?: string
}

export interface SymbolValue {
  symbolName: string
  stVal: number
  t: string           // formatted timestamp string from t.value
  lastUpdated: Date   // client-side timestamp when data was received
  rawData?: Record<string, unknown>
}

export interface SymbolHistoryPoint {
  value: number
  timestamp: Date
  formattedTime: string
}

export interface SymbolHistory {
  symbolName: string
  dataPoints: SymbolHistoryPoint[]
  maxPoints: number
}

// Authentication
export interface AuthCredentials {
  serverUrl: string
  username: string
  password: string
}

export interface AuthTokenResponse {
  AccessToken: string
  ExpiresIn: number
  Scope: string
  TokenType: string
}

export interface AuthErrorResponse {
  title: string
  status: number
  detail: string
}

// Connection & polling state
export interface ConnectionStatus {
  isConnected: boolean
  lastConnection?: Date
  error?: string
}

export interface PollingState {
  isPolling: boolean
  interval: number
  lastPoll?: Date
}

export interface ApiError {
  message: string
  status?: number
  timestamp: Date
  cancelled?: boolean
}

// Union types
export type QualityValidity = 'good' | 'invalid' | 'questionable'
export type RangeStatus = 'normal' | 'high' | 'low' | 'high-high' | 'low-low'
export type SymbolStatus = 'active' | 'stale' | 'inactive'
export type Theme = 'light' | 'dark' | 'auto'
export type PollingInterval = 1000 | 2000 | 5000 | 10000
