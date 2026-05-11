/** Returns a human-readable relative time string, e.g. "2s ago", "1m ago". */
export function formatRelativeTime(date: Date | null | undefined): string {
  if (!date) return '—'
  const seconds = Math.floor((Date.now() - date.getTime()) / 1_000)
  if (seconds < 2) return 'just now'
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  return `${hours}h ago`
}

/** Returns HH:MM:SS from a date or ISO string. */
export function formatTimestamp(value: Date | string | null | undefined): string {
  if (!value) return '—'
  const date = typeof value === 'string' ? new Date(value) : value
  if (isNaN(date.getTime())) return '—'
  return date.toLocaleTimeString()
}

/** Returns a full absolute timestamp, e.g. "2024-12-03 14:30:00". */
export function formatFullTimestamp(date: Date | null | undefined): string {
  if (!date) return '—'
  return date.toLocaleString()
}
