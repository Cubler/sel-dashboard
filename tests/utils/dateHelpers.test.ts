import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { formatRelativeTime, formatTimestamp, formatFullTimestamp } from '~/utils/dateHelpers'

describe('formatRelativeTime', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('returns "—" for null', () => expect(formatRelativeTime(null)).toBe('—'))
  it('returns "—" for undefined', () => expect(formatRelativeTime(undefined)).toBe('—'))

  it('returns "just now" for <2 seconds ago', () => {
    expect(formatRelativeTime(new Date(Date.now() - 1_000))).toBe('just now')
  })

  it('returns seconds for 2–59 seconds ago', () => {
    expect(formatRelativeTime(new Date(Date.now() - 30_000))).toBe('30s ago')
  })

  it('returns minutes for 60+ seconds ago', () => {
    expect(formatRelativeTime(new Date(Date.now() - 90_000))).toBe('1m ago')
    expect(formatRelativeTime(new Date(Date.now() - 120_000))).toBe('2m ago')
  })

  it('returns hours for 3600+ seconds ago', () => {
    expect(formatRelativeTime(new Date(Date.now() - 3_600_000))).toBe('1h ago')
  })
})

describe('formatTimestamp', () => {
  it('returns "—" for null', () => expect(formatTimestamp(null)).toBe('—'))
  it('returns "—" for undefined', () => expect(formatTimestamp(undefined)).toBe('—'))
  it('returns "—" for an unparseable string', () => expect(formatTimestamp('not-a-date')).toBe('—'))

  it('formats a valid ISO string to HH:MM:SS', () => {
    const result = formatTimestamp('2024-12-03T00:00:00.000Z')
    expect(result).toMatch(/\d+:\d+/)
  })

  it('formats a Date object', () => {
    const result = formatTimestamp(new Date('2024-12-03T00:00:00.000Z'))
    expect(result).toMatch(/\d+:\d+/)
  })
})

describe('formatFullTimestamp', () => {
  it('returns "—" for null', () => expect(formatFullTimestamp(null)).toBe('—'))
  it('returns "—" for undefined', () => expect(formatFullTimestamp(undefined)).toBe('—'))

  it('returns a non-empty human-readable string for a valid date', () => {
    const result = formatFullTimestamp(new Date())
    expect(result).not.toBe('—')
    expect(result.length).toBeGreaterThan(0)
  })
})
