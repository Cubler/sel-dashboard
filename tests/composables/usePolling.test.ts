import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, ref, type Ref } from 'vue'
import { usePolling } from '~/composables/usePolling'

// ── Mount helper ──────────────────────────────────────────────────────────────

function createWrapper(
  callback: () => Promise<void>,
  interval: Ref<number> = ref(1_000),
) {
  const exposed: ReturnType<typeof usePolling> = {} as ReturnType<typeof usePolling>

  const wrapper = mount(
    defineComponent({
      setup() {
        const polling = usePolling(callback, interval)
        Object.assign(exposed, polling)
        return polling
      },
      template: '<div />',
    }),
  )

  return { wrapper, polling: exposed }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('usePolling', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('starts in a stopped state', () => {
    const { polling } = createWrapper(vi.fn().mockResolvedValue(undefined))
    expect(polling.isPolling.value).toBe(false)
  })

  it('sets isPolling to true after start()', () => {
    const { polling } = createWrapper(vi.fn().mockResolvedValue(undefined))
    polling.start()
    expect(polling.isPolling.value).toBe(true)
  })

  it('fires the callback on each interval tick', async () => {
    const cb = vi.fn().mockResolvedValue(undefined)
    const { polling } = createWrapper(cb)

    polling.start()
    await vi.advanceTimersByTimeAsync(1_000)
    expect(cb).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(1_000)
    expect(cb).toHaveBeenCalledTimes(2)
  })

  it('stops firing after stop()', async () => {
    const cb = vi.fn().mockResolvedValue(undefined)
    const { polling } = createWrapper(cb)

    polling.start()
    polling.stop()
    expect(polling.isPolling.value).toBe(false)

    await vi.advanceTimersByTimeAsync(3_000)
    expect(cb).not.toHaveBeenCalled()
  })

  it('cleans up the interval on component unmount', async () => {
    const cb = vi.fn().mockResolvedValue(undefined)
    const { wrapper, polling } = createWrapper(cb)

    polling.start()
    wrapper.unmount()

    await vi.advanceTimersByTimeAsync(3_000)
    expect(cb).not.toHaveBeenCalled()
  })

  it('does not start a second timer if already polling', async () => {
    const cb = vi.fn().mockResolvedValue(undefined)
    const { polling } = createWrapper(cb)

    polling.start()
    polling.start() // second call should be a no-op

    await vi.advanceTimersByTimeAsync(1_000)
    expect(cb).toHaveBeenCalledTimes(1) // only one interval running
  })

  it('does nothing when interval changes while stopped', async () => {
    const cb = vi.fn().mockResolvedValue(undefined)
    const interval = ref(1_000)
    const { polling } = createWrapper(cb, interval)

    // Not started — changing interval should be a no-op
    interval.value = 2_000
    await vi.advanceTimersByTimeAsync(3_000)
    expect(cb).not.toHaveBeenCalled()
    expect(polling.isPolling.value).toBe(false)
  })

  it('restarts at the new cadence when interval changes while polling', async () => {
    const cb = vi.fn().mockResolvedValue(undefined)
    const interval = ref(1_000)
    const { polling } = createWrapper(cb, interval)

    polling.start()
    interval.value = 2_000 // switch to 2-second interval

    // 1 second later — should NOT fire (old 1s interval cancelled)
    await vi.advanceTimersByTimeAsync(1_000)
    expect(cb).toHaveBeenCalledTimes(0)

    // Another second (2s total) — new 2s interval fires
    await vi.advanceTimersByTimeAsync(1_000)
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it('skips a tick when the previous poll is still in flight', async () => {
    let resolve!: () => void
    // Callback returns a promise that only resolves when we call resolve()
    const cb = vi.fn(() => new Promise<void>(r => (resolve = r)))
    const { polling } = createWrapper(cb)

    polling.start()

    // Tick 1 — callback starts, not yet resolved
    await vi.advanceTimersByTimeAsync(1_000)
    expect(cb).toHaveBeenCalledTimes(1)

    // Tick 2 — previous call still in flight, skip
    await vi.advanceTimersByTimeAsync(1_000)
    expect(cb).toHaveBeenCalledTimes(1)

    // Resolve first call and flush microtasks
    resolve()
    await Promise.resolve()

    // Tick 3 — now free to fire again
    await vi.advanceTimersByTimeAsync(1_000)
    expect(cb).toHaveBeenCalledTimes(2)
  })
})
