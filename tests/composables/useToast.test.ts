import { describe, it, expect, vi, beforeEach } from 'vitest'

// Import fresh module per test via re-import trick
import { useToast } from '~/composables/useToast'

describe('useToast', () => {
  beforeEach(() => {
    // Clear the shared toast list between tests
    const { toasts } = useToast()
    toasts.value.splice(0)
  })

  it('adds a toast and returns it', () => {
    const { toasts, show } = useToast()
    show('hello', 'success')
    expect(toasts.value).toHaveLength(1)
    expect(toasts.value[0]).toMatchObject({ message: 'hello', type: 'success' })
  })

  it('assigns unique ids to each toast', () => {
    const { toasts, show } = useToast()
    show('a', 'info')
    show('b', 'error')
    expect(toasts.value[0]!.id).not.toBe(toasts.value[1]!.id)
  })

  it('dismiss removes the correct toast', () => {
    const { toasts, show, dismiss } = useToast()
    show('first', 'info')
    show('second', 'info')
    const id = toasts.value[0]!.id
    dismiss(id)
    expect(toasts.value).toHaveLength(1)
    expect(toasts.value[0]!.message).toBe('second')
  })

  it('dismiss is a no-op for unknown id', () => {
    const { toasts, show, dismiss } = useToast()
    show('x', 'info')
    dismiss(99999)
    expect(toasts.value).toHaveLength(1)
  })

  it('auto-dismisses after the configured duration', async () => {
    vi.useFakeTimers()
    const { toasts, show } = useToast()
    show('auto', 'info', 500)
    expect(toasts.value).toHaveLength(1)
    vi.advanceTimersByTime(500)
    expect(toasts.value).toHaveLength(0)
    vi.useRealTimers()
  })
})
