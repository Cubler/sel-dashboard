import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { exportSymbolsCsv } from '~/utils/csvExport'
import type { Symbol, SymbolValue } from '~/types/api'

// ── Browser API stubs ────────────────────────────────────────────────────────

let capturedBlobContent = ''
let capturedDownloadAttr = ''

function setupBrowserMocks() {
  capturedBlobContent = ''
  capturedDownloadAttr = ''

  vi.stubGlobal('Blob', class {
    constructor(parts: BlobPart[]) {
      capturedBlobContent = parts[0] as string
    }
  })
  vi.stubGlobal('URL', {
    createObjectURL: vi.fn(() => 'blob:mock-url'),
    revokeObjectURL: vi.fn(),
  })

  const mockAnchor = {
    href: '',
    set download(v: string) { capturedDownloadAttr = v },
    click: vi.fn(),
  }
  vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as unknown as HTMLElement)
  vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockAnchor as unknown as Node)
  vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockAnchor as unknown as Node)
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

// ── Helpers ───────────────────────────────────────────────────────────────────

const SYMBOLS: Symbol[] = [
  { name: 'AnalogDeadband', type: 'INS', description: 'Deadband' },
  { name: 'MotorSpeed', type: 'INS', description: 'Speed' },
]

function makeValue(name: string, stVal: number): SymbolValue {
  return {
    symbolName: name,
    stVal,
    t: '14:30:00',
    lastUpdated: new Date(Date.now() - 1_000), // 1s ago → active
    rawData: {},
  }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('exportSymbolsCsv', () => {
  beforeEach(setupBrowserMocks)

  it('includes the correct CSV headers', () => {
    exportSymbolsCsv(SYMBOLS, new Map())
    expect(capturedBlobContent).toContain('Symbol Name,Value,Timestamp,Last Updated,Status')
  })

  it('includes a row for each symbol', () => {
    const values = new Map([
      ['AnalogDeadband', makeValue('AnalogDeadband', 42)],
      ['MotorSpeed', makeValue('MotorSpeed', 1750)],
    ])
    exportSymbolsCsv(SYMBOLS, values)
    expect(capturedBlobContent).toContain('AnalogDeadband')
    expect(capturedBlobContent).toContain('42')
    expect(capturedBlobContent).toContain('MotorSpeed')
    expect(capturedBlobContent).toContain('1750')
  })

  it('quotes a symbol name that contains a comma', () => {
    const commaSymbol: Symbol[] = [{ name: 'Sym,WithComma', type: 'INS' }]
    exportSymbolsCsv(commaSymbol, new Map())
    expect(capturedBlobContent).toContain('"Sym,WithComma"')
  })

  it('uses the filtered symbol list — not the full set', () => {
    // Pass only AnalogDeadband as the "filtered" list
    exportSymbolsCsv([SYMBOLS[0]!], new Map())
    expect(capturedBlobContent).toContain('AnalogDeadband')
    expect(capturedBlobContent).not.toContain('MotorSpeed')
  })

  it('generates a filename with an ISO timestamp', () => {
    exportSymbolsCsv(SYMBOLS, new Map())
    expect(capturedDownloadAttr).toMatch(/^symbols-export-\d{4}-\d{2}-\d{2}/)
    expect(capturedDownloadAttr).toMatch(/\.csv$/)
  })
})
