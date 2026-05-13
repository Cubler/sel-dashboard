import type { Symbol, SymbolValue } from '~/types/api'
import { getSymbolStatus, getStatusLabel } from '~/utils/qualityHelpers'
import { formatTimestamp, formatRelativeTime } from '~/utils/dateHelpers'

const CSV_HEADERS = ['Symbol Name', 'Value', 'Timestamp', 'Last Updated', 'Status']

function escapeCsvValue(val: string): string {
  // Quote if the value contains a comma, double-quote, or newline
  if (val.includes(',') || val.includes('"') || val.includes('\n')) {
    return `"${val.replace(/"/g, '""')}"`
  }
  return val
}

/**
 * Exports the currently filtered+sorted symbol list as a CSV download.
 * Call with `filteredSymbols` (already sorted/filtered) and the full values map.
 */
export function exportSymbolsCsv(
  filteredSymbols: Symbol[],
  symbolValues: Map<string, SymbolValue>,
): void {
  const rows = filteredSymbols.map((symbol) => {
    const value = symbolValues.get(symbol.name)
    const status = getSymbolStatus(value?.lastUpdated)
    return [
      symbol.name,
      value !== undefined ? String(value.stVal) : '',
      value ? formatTimestamp(value.t) : '',
      value ? formatRelativeTime(value.lastUpdated) : '',
      getStatusLabel(status),
    ].map(escapeCsvValue)
  })

  const csvContent = [
    CSV_HEADERS.join(','),
    ...rows.map(r => r.join(',')),
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `symbols-export-${new Date().toISOString().replace(/[:.]/g, '-')}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
