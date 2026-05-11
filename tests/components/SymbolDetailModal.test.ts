import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import type { Symbol, SymbolHistory, SymbolValue } from '~/types/api'

// Chart.js mock — use a class so `new Chart(...)` works in SymbolHistoryChart
vi.mock('chart.js', () => {
  class Chart {
    data = { labels: [] as string[], datasets: [{ data: [] as number[] }] }
    destroy() {}
    update(_mode?: string) {}
    static register() {}
  }
  return { Chart, LineElement: {}, PointElement: {}, LinearScale: {}, CategoryScale: {}, Tooltip: {}, Filler: {} }
})

import SymbolDetailModal from '~/components/SymbolDetailModal.vue'

// ── Test fixtures ─────────────────────────────────────────────────────────────

const SYMBOL: Symbol = { name: 'AnalogDeadband', type: 'INS', description: 'Deadband threshold' }

const VALUE: SymbolValue = {
  symbolName: 'AnalogDeadband',
  stVal: 42,
  t: '2024-12-03T14:30:00.000Z',
  lastUpdated: new Date(Date.now() - 2_000),
  rawData: {
    units: 'mV',
    range: 'normal',
    multiplier: 1.0,
    d: 'Analog input deadband threshold',
    q: {
      validity: 'good',
      source: 'process',
      operatorBlocked: false,
      test: false,
      detailQual: {
        overflow: false, outOfRange: false, badReference: false, oscillatory: false,
        failure: false, oldData: false, inconsistent: false, inaccurate: false,
      },
    },
    t: { clockNotSynchronized: false, clockFailure: false },
  },
}

const EMPTY_HISTORY: SymbolHistory = { symbolName: 'AnalogDeadband', dataPoints: [], maxPoints: 50 }

function mountModal(overrides?: { symbolValues?: Map<string, SymbolValue> }) {
  return mount(SymbolDetailModal, {
    props: {
      symbolName: 'AnalogDeadband',
      symbols: [SYMBOL],
      symbolValues: overrides?.symbolValues ?? new Map([['AnalogDeadband', VALUE]]),
      symbolHistory: new Map([['AnalogDeadband', EMPTY_HISTORY]]),
    },
    attachTo: document.body,
  })
}

// ── Helpers for Teleport content ──────────────────────────────────────────────
// SymbolDetailModal uses <Teleport to="body">, so content is rendered directly
// in document.body — not inside the wrapper element. Query document.body directly.

function bodyText() { return document.body.textContent ?? '' }
function bodyFind(sel: string) { return document.body.querySelector(sel) }

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('SymbolDetailModal', () => {
  afterEach(() => {
    // Clean up any leftover portal content
    document.body.querySelectorAll('[role="dialog"]').forEach(el => el.remove())
  })

  it('renders the symbol name in the modal header', () => {
    const wrapper = mountModal()
    expect(bodyFind('h2')?.textContent?.trim()).toBe('AnalogDeadband')
    wrapper.unmount()
  })

  it('displays the current stVal and units', () => {
    const wrapper = mountModal()
    expect(bodyText()).toContain('42')
    expect(bodyText()).toContain('mV')
    wrapper.unmount()
  })

  it('shows description from rawData', () => {
    const wrapper = mountModal()
    expect(bodyText()).toContain('Analog input deadband threshold')
    wrapper.unmount()
  })

  it('shows quality indicators section', () => {
    const wrapper = mountModal()
    expect(bodyText()).toContain('Valid data')
    wrapper.unmount()
  })

  it('emits "close" when the X button is clicked', async () => {
    const wrapper = mountModal()
    const btn = bodyFind('button[aria-label="Close"]') as HTMLButtonElement | null
    btn?.click()
    await flushPromises()
    expect(wrapper.emitted('close')).toBeTruthy()
    wrapper.unmount()
  })

  it('emits "close" when Escape key is pressed', async () => {
    const wrapper = mountModal()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await flushPromises()
    expect(wrapper.emitted('close')).toBeTruthy()
    wrapper.unmount()
  })

  it('shows placeholder "—" when symbol has no value in the map', () => {
    const wrapper = mountModal({ symbolValues: new Map() })
    expect(bodyText()).toContain('—')
    wrapper.unmount()
  })

  it('removes the keydown listener on unmount', () => {
    const spy = vi.spyOn(document, 'removeEventListener')
    const wrapper = mountModal()
    wrapper.unmount()
    expect(spy).toHaveBeenCalledWith('keydown', expect.any(Function))
    spy.mockRestore()
  })
})
