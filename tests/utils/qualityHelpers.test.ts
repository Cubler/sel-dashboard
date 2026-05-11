import { describe, it, expect, vi, afterEach } from 'vitest'
import { getSymbolStatus, getStatusLabel } from '~/utils/qualityHelpers'

describe('getSymbolStatus', () => {
  afterEach(() => vi.useRealTimers())

  it('returns inactive when lastUpdated is undefined', () => {
    expect(getSymbolStatus(undefined)).toBe('inactive')
  })

  it('returns active when updated less than 30 seconds ago', () => {
    vi.useFakeTimers()
    const date = new Date(Date.now() - 10_000) // 10s ago
    expect(getSymbolStatus(date)).toBe('active')
  })

  it('returns stale when updated 30–60 seconds ago', () => {
    vi.useFakeTimers()
    const date = new Date(Date.now() - 45_000) // 45s ago
    expect(getSymbolStatus(date)).toBe('stale')
  })

  it('returns inactive when updated more than 60 seconds ago', () => {
    vi.useFakeTimers()
    const date = new Date(Date.now() - 90_000) // 90s ago
    expect(getSymbolStatus(date)).toBe('inactive')
  })

  it('returns active for a just-now timestamp', () => {
    const date = new Date()
    expect(getSymbolStatus(date)).toBe('active')
  })
})

describe('getStatusLabel', () => {
  it('returns "Active" for active', () => {
    expect(getStatusLabel('active')).toBe('Active')
  })

  it('returns "Stale" for stale', () => {
    expect(getStatusLabel('stale')).toBe('Stale')
  })

  it('returns "Inactive" for inactive', () => {
    expect(getStatusLabel('inactive')).toBe('Inactive')
  })
})
