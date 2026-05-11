import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import type { SymbolHistory } from '~/types/api'

// ── Chart.js mock — use a class so `new Chart(...)` works ──────────────────────

vi.mock('chart.js', () => {
  class Chart {
    data = { labels: [] as string[], datasets: [{ data: [] as number[] }] }
    // Prototype methods so vi.spyOn works
    destroy() {}
    update(_mode?: string) {}
    static register() {}
  }
  return { Chart, LineElement: {}, PointElement: {}, LinearScale: {}, CategoryScale: {}, Tooltip: {}, Filler: {} }
})

import SymbolHistoryChart from '~/components/SymbolHistoryChart.vue'
import { Chart } from 'chart.js'

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeHistory(n: number): SymbolHistory {
  const base = Date.now()
  return {
    symbolName: 'TestSymbol',
    maxPoints: 50,
    dataPoints: Array.from({ length: n }, (_, i) => ({
      value: 40 + i,
      timestamp: new Date(base - (n - i) * 1_000),
      formattedTime: `14:30:0${i}`,
    })),
  }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('SymbolHistoryChart', () => {
  let destroySpy: ReturnType<typeof vi.spyOn>
  let updateSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    destroySpy = vi.spyOn(Chart.prototype, 'destroy')
    updateSpy = vi.spyOn(Chart.prototype, 'update')
  })

  afterEach(() => vi.restoreAllMocks())

  it('shows the "Collecting data" empty state when history is undefined', () => {
    const wrapper = mount(SymbolHistoryChart, { props: { history: undefined } })
    expect(wrapper.text()).toContain('Collecting data')
  })

  it('shows the empty state when fewer than 2 data points exist', () => {
    const wrapper = mount(SymbolHistoryChart, { props: { history: makeHistory(1) } })
    expect(wrapper.text()).toContain('Collecting data')
  })

  it('shows the data-point count in the empty state label', () => {
    const wrapper = mount(SymbolHistoryChart, { props: { history: makeHistory(1) } })
    expect(wrapper.text()).toContain('1')
  })

  it('creates a Chart instance when 2+ data points are provided', async () => {
    mount(SymbolHistoryChart, { props: { history: makeHistory(5) } })
    await Promise.resolve()
    // If Chart was instantiated, the canvas element is visible (v-show = true)
    const wrapper = mount(SymbolHistoryChart, { props: { history: makeHistory(5) } })
    await Promise.resolve()
    const canvas = wrapper.find('canvas')
    expect(canvas.element.style.display).not.toBe('none')
  })

  it('hides the canvas element in the empty state', () => {
    const wrapper = mount(SymbolHistoryChart, { props: { history: makeHistory(1) } })
    const canvas = wrapper.find('canvas')
    // v-show hides the canvas when hasEnoughData is false
    expect(canvas.element.style.display).toBe('none')
  })

  it('calls chart.destroy() on unmount when chart exists', async () => {
    const wrapper = mount(SymbolHistoryChart, { props: { history: makeHistory(5) } })
    await Promise.resolve() // chart created in onMounted
    wrapper.unmount()
    expect(destroySpy).toHaveBeenCalled()
  })

  it('calls chart.update("none") when new data points arrive after chart is created', async () => {
    const { flushPromises } = await import('@vue/test-utils')
    const history = makeHistory(3)
    const wrapper = mount(SymbolHistoryChart, { props: { history } })
    await flushPromises() // ensure chart is initialised

    // Pass a new array reference so the deep watch detects the change
    const newPoint = { value: 99, timestamp: new Date(), formattedTime: '14:31:00' }
    await wrapper.setProps({
      history: { ...history, dataPoints: [...history.dataPoints, newPoint] },
    })
    await flushPromises()

    expect(updateSpy).toHaveBeenCalledWith('none')
  })
})
