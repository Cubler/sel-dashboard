import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getSymbolStatus, getStatusLabel } from '~/utils/qualityHelpers'

describe('getSymbolStatus', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('returns "inactive" when lastUpdated is undefined', () => {
    expect(getSymbolStatus(undefined)).toBe('inactive')
  })

  it('returns "active" when updated within 30 seconds', () => {
    expect(getSymbolStatus(new Date(Date.now() - 10_000))).toBe('active')
  })

  it('returns "stale" when updated between 30 and 60 seconds ago', () => {
    expect(getSymbolStatus(new Date(Date.now() - 45_000))).toBe('stale')
  })

  it('returns "inactive" when updated more than 60 seconds ago', () => {
    expect(getSymbolStatus(new Date(Date.now() - 90_000))).toBe('inactive')
  })

  it('treats 30s boundary as stale (not active)', () => {
    expect(getSymbolStatus(new Date(Date.now() - 29_999))).toBe('active')
    expect(getSymbolStatus(new Date(Date.now() - 30_000))).toBe('stale')
  })

  it('treats 60s boundary as inactive (not stale)', () => {
    expect(getSymbolStatus(new Date(Date.now() - 59_999))).toBe('stale')
    expect(getSymbolStatus(new Date(Date.now() - 60_000))).toBe('inactive')
  })
})

describe('getStatusLabel', () => {
  it('capitalises each status', () => {
    expect(getStatusLabel('active')).toBe('Active')
    expect(getStatusLabel('stale')).toBe('Stale')
    expect(getStatusLabel('inactive')).toBe('Inactive')
  })
})
