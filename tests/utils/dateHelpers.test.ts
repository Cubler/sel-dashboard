import { describe, it, expect, vi, afterEach } from 'vitest'
import { formatRelativeTime, formatTimestamp, formatFullTimestamp } from '~/utils/dateHelpers'

describe('formatRelativeTime', () => {
  afterEach(() => vi.useRealTimers())

  it('returns "—" for null', () => {
    expect(formatRelativeTime(null)).toBe('—')
  })

  it('returns "—" for undefined', () => {
    expect(formatRelativeTime(undefined)).toBe('—')
  })

  it('returns "just now" for a very recent date', () => {
    vi.useFakeTimers()
    const date = new Date(Date.now() - 500)
    expect(formatRelativeTime(date)).toBe('just now')
  })

  it('returns seconds for dates 2–59s ago', () => {
    vi.useFakeTimers()
    const date = new Date(Date.now() - 10_000)
    expect(formatRelativeTime(date)).toBe('10s ago')
  })

  it('returns minutes for dates 60s+ ago', () => {
    vi.useFakeTimers()
    const date = new Date(Date.now() - 90_000)
    expect(formatRelativeTime(date)).toBe('1m ago')
  })

  it('returns hours for dates 60+ minutes ago', () => {
    vi.useFakeTimers()
    const date = new Date(Date.now() - 2 * 60 * 60 * 1_000)
    expect(formatRelativeTime(date)).toBe('2h ago')
  })
})

describe('formatTimestamp', () => {
  it('returns "—" for null', () => {
    expect(formatTimestamp(null)).toBe('—')
  })

  it('returns "—" for undefined', () => {
    expect(formatTimestamp(undefined)).toBe('—')
  })

  it('returns "—" for an invalid date string', () => {
    expect(formatTimestamp('not-a-date')).toBe('—')
  })

  it('returns a time string for a valid ISO string', () => {
    const result = formatTimestamp('2024-12-03T14:30:00.000Z')
    expect(typeof result).toBe('string')
    expect(result).not.toBe('—')
  })

  it('accepts a Date object', () => {
    const result = formatTimestamp(new Date('2024-12-03T14:30:00.000Z'))
    expect(result).not.toBe('—')
  })
})

describe('formatFullTimestamp', () => {
  it('returns "—" for null', () => {
    expect(formatFullTimestamp(null)).toBe('—')
  })

  it('returns "—" for undefined', () => {
    expect(formatFullTimestamp(undefined)).toBe('—')
  })

  it('returns a non-empty string for a valid date', () => {
    const result = formatFullTimestamp(new Date('2024-12-03T14:30:00.000Z'))
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
    expect(result).not.toBe('—')
  })
})
