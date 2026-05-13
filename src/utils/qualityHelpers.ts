import type { SymbolStatus } from '~/types/api'

// Thresholds match the spec's UI description (Active < 30s, Stale 30-60s, Inactive > 60s)
const ACTIVE_THRESHOLD_MS = 30_000
const STALE_THRESHOLD_MS = 60_000

export function getSymbolStatus(lastUpdated: Date | undefined): SymbolStatus {
  if (!lastUpdated) return 'inactive'
  const age = Date.now() - lastUpdated.getTime()
  if (age < ACTIVE_THRESHOLD_MS) return 'active'
  if (age < STALE_THRESHOLD_MS) return 'stale'
  return 'inactive'
}

export function getStatusLabel(status: SymbolStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1)
}
