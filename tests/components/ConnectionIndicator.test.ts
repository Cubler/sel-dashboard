import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ConnectionIndicator from '~/components/ConnectionIndicator.vue'

afterEach(() => vi.useRealTimers())

describe('ConnectionIndicator', () => {
  it('shows "Connected" when status.isConnected is true', () => {
    const wrapper = mount(ConnectionIndicator, {
      props: { status: { isConnected: true }, lastUpdated: null },
    })
    expect(wrapper.text()).toContain('Connected')
  })

  it('shows "Disconnected" when status.isConnected is false', () => {
    const wrapper = mount(ConnectionIndicator, {
      props: { status: { isConnected: false }, lastUpdated: null },
    })
    expect(wrapper.text()).toContain('Disconnected')
  })

  it('shows a green dot when connected', () => {
    const wrapper = mount(ConnectionIndicator, {
      props: { status: { isConnected: true }, lastUpdated: null },
    })
    expect(wrapper.html()).toContain('bg-green-500')
  })

  it('shows a red dot when disconnected', () => {
    const wrapper = mount(ConnectionIndicator, {
      props: { status: { isConnected: false }, lastUpdated: null },
    })
    expect(wrapper.html()).toContain('bg-red-500')
  })

  it('shows relative time when lastUpdated is provided', () => {
    vi.useFakeTimers()
    const lastUpdated = new Date(Date.now() - 5_000) // 5s ago
    const wrapper = mount(ConnectionIndicator, {
      props: { status: { isConnected: true }, lastUpdated },
    })
    expect(wrapper.text()).toContain('5s ago')
  })

  it('does not show relative time when lastUpdated is null', () => {
    const wrapper = mount(ConnectionIndicator, {
      props: { status: { isConnected: true }, lastUpdated: null },
    })
    expect(wrapper.text()).not.toContain('ago')
  })
})
