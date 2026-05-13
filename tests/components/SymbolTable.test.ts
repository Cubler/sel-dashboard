import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import SymbolTable from '~/components/SymbolTable.vue'
import type { Symbol, SymbolValue } from '~/types/api'

// ── Mock csvExport so tests don't trigger file downloads ──────────────────────
// Use vi.hoisted so the variable exists before vi.mock() factory runs

const { mockExportFn } = vi.hoisted(() => ({ mockExportFn: vi.fn() }))
vi.mock('~/utils/csvExport', () => ({ exportSymbolsCsv: mockExportFn }))

// ── Test data ─────────────────────────────────────────────────────────────────

const SYMBOLS: Symbol[] = [
  { name: 'AnalogDeadband', type: 'INS', description: 'Deadband' },
  { name: 'BinaryDebounce', type: 'INS', description: 'Debounce' },
  { name: 'CommTimeout', type: 'INS', description: 'Timeout' },
  { name: 'MotorSpeed', type: 'INS', description: 'Speed' },
]

function makeValue(name: string, stVal: number): SymbolValue {
  return {
    symbolName: name,
    stVal,
    t: '14:30:00',
    lastUpdated: new Date(Date.now() - 1_000), // active
    rawData: { units: 'mV', q: { validity: 'good' } },
  }
}

const VALUES = new Map<string, SymbolValue>(
  SYMBOLS.map(s => [s.name, makeValue(s.name, Math.floor(Math.random() * 1000))]),
)

// ── Mount helper ──────────────────────────────────────────────────────────────

function mountTable(symbols = SYMBOLS, symbolValues = VALUES) {
  return mount(SymbolTable, {
    props: { symbols, symbolValues },
    attachTo: document.body,
  })
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('SymbolTable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('renders a row for each symbol', () => {
    const wrapper = mountTable()
    const rows = wrapper.findAll('tbody tr')
    expect(rows).toHaveLength(SYMBOLS.length)
  })

  it('renders symbol names in the table', () => {
    const wrapper = mountTable()
    const text = wrapper.text()
    expect(text).toContain('AnalogDeadband')
    expect(text).toContain('MotorSpeed')
  })

  it('shows an empty state when no symbols provided', () => {
    const wrapper = mountTable([], new Map())
    expect(wrapper.text()).toContain('No symbols available')
  })

  it('filters rows after the 300ms debounce', async () => {
    const wrapper = mountTable()
    const search = wrapper.find('[aria-label="Search symbols"]')

    await search.setValue('AnalogDeadband')
    expect(wrapper.findAll('tbody tr')).toHaveLength(SYMBOLS.length) // not yet filtered

    vi.advanceTimersByTime(300)
    await flushPromises()

    expect(wrapper.findAll('tbody tr')).toHaveLength(1)
    expect(wrapper.text()).toContain('AnalogDeadband')
    expect(wrapper.text()).not.toContain('MotorSpeed')
  })

  it('shows empty state message when search matches nothing', async () => {
    const wrapper = mountTable()
    await wrapper.find('[aria-label="Search symbols"]').setValue('zzz-no-match')
    vi.advanceTimersByTime(300)
    await flushPromises()

    expect(wrapper.text()).toContain('No symbols match')
  })

  it('toggles sort direction when the same column header is clicked twice', async () => {
    const wrapper = mountTable()
    const nameHeader = wrapper.findAll('th').find(h => h.text().includes('Symbol Name'))!

    await nameHeader.trigger('click')
    expect(wrapper.text()).toContain('↑')

    await nameHeader.trigger('click')
    expect(wrapper.text()).toContain('↓')
  })

  it('emits "select" when a row is clicked', async () => {
    const wrapper = mountTable()
    await wrapper.findAll('tbody tr')[0]!.trigger('click')
    expect(wrapper.emitted('select')).toBeTruthy()
    expect(wrapper.emitted('select')![0]).toEqual([SYMBOLS[0]!.name])
  })

  it('emits "select" when Enter is pressed on a row', async () => {
    const wrapper = mountTable()
    await wrapper.findAll('tbody tr')[0]!.trigger('keydown.enter')
    expect(wrapper.emitted('select')).toBeTruthy()
  })

  it('calls exportSymbolsCsv when the Export CSV button is clicked', async () => {
    const wrapper = mountTable()
    await wrapper.find('button', { text: 'Export CSV' } as any).trigger('click')
    expect(mockExportFn).toHaveBeenCalledOnce()
    // Should be called with the filtered (all) symbols and the values map
    expect(mockExportFn.mock.calls[0]![0]).toHaveLength(SYMBOLS.length)
  })

  it('shows "Showing N of N symbols" in the footer', () => {
    const wrapper = mountTable()
    expect(wrapper.text()).toContain(`Showing ${SYMBOLS.length} of ${SYMBOLS.length} symbols`)
  })

  it('respects pagination — shows only pageSize rows', async () => {
    // Create 30 symbols to exceed default page size of 25
    const manySymbols: Symbol[] = Array.from({ length: 30 }, (_, i) => ({
      name: `Symbol${String(i).padStart(2, '0')}`,
      type: 'INS',
    }))
    const manyValues = new Map<string, SymbolValue>(
      manySymbols.map((s, i) => [s.name, makeValue(s.name, i)]),
    )
    const wrapper = mountTable(manySymbols, manyValues)
    expect(wrapper.findAll('tbody tr')).toHaveLength(25)
  })
})
