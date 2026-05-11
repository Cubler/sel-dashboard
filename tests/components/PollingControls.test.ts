import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PollingControls from '~/components/PollingControls.vue'

describe('PollingControls', () => {
  it('shows "Start Polling" when not polling', () => {
    const wrapper = mount(PollingControls, { props: { isPolling: false, interval: 2000 } })
    expect(wrapper.text()).toContain('Start Polling')
  })

  it('shows "Stop Polling" when polling', () => {
    const wrapper = mount(PollingControls, { props: { isPolling: true, interval: 2000 } })
    expect(wrapper.text()).toContain('Stop Polling')
  })

  it('emits "start" when button is clicked while not polling', async () => {
    const wrapper = mount(PollingControls, { props: { isPolling: false, interval: 2000 } })
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('start')).toBeTruthy()
  })

  it('emits "stop" when button is clicked while polling', async () => {
    const wrapper = mount(PollingControls, { props: { isPolling: true, interval: 2000 } })
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('stop')).toBeTruthy()
  })

  it('emits "change-interval" with numeric value when select changes', async () => {
    const wrapper = mount(PollingControls, { props: { isPolling: false, interval: 2000 } })
    const select = wrapper.find('select')
    await select.setValue('5000')
    expect(wrapper.emitted('change-interval')).toBeTruthy()
    expect(wrapper.emitted('change-interval')![0]).toEqual([5000])
  })

  it('renders all four interval options', () => {
    const wrapper = mount(PollingControls, { props: { isPolling: false, interval: 2000 } })
    const options = wrapper.findAll('option')
    const values = options.map(o => o.element.value)
    expect(values).toContain('1000')
    expect(values).toContain('2000')
    expect(values).toContain('5000')
    expect(values).toContain('10000')
  })
})
