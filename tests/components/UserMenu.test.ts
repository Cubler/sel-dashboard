import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import UserMenu from '~/components/UserMenu.vue'

describe('UserMenu', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    document.documentElement.classList.remove('dark')
  })

  it('renders a gear icon trigger button', () => {
    const wrapper = mount(UserMenu)
    expect(wrapper.find('button[aria-label="Settings"]').exists()).toBe(true)
  })

  it('panel is hidden before the button is clicked', () => {
    const wrapper = mount(UserMenu)
    expect(wrapper.find('#settings-panel').exists()).toBe(false)
  })

  it('shows the settings panel after clicking the gear button', async () => {
    const wrapper = mount(UserMenu)
    await wrapper.find('button[aria-label="Settings"]').trigger('click')
    expect(wrapper.find('#settings-panel').exists()).toBe(true)
  })

  it('hides the panel again after a second click', async () => {
    const wrapper = mount(UserMenu)
    await wrapper.find('button[aria-label="Settings"]').trigger('click')
    await wrapper.find('button[aria-label="Settings"]').trigger('click')
    expect(wrapper.find('#settings-panel').exists()).toBe(false)
  })

  it('shows Auto, Light, and Dark theme options inside the panel', async () => {
    const wrapper = mount(UserMenu)
    await wrapper.find('button[aria-label="Settings"]').trigger('click')
    const panelText = wrapper.find('#settings-panel').text()
    expect(panelText).toContain('Auto')
    expect(panelText).toContain('Light')
    expect(panelText).toContain('Dark')
  })

  it('closes the panel on Escape keydown', async () => {
    const wrapper = mount(UserMenu, { attachTo: document.body })
    await wrapper.find('button[aria-label="Settings"]').trigger('click')
    expect(wrapper.find('#settings-panel').exists()).toBe(true)

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await wrapper.vm.$nextTick()

    expect(wrapper.find('#settings-panel').exists()).toBe(false)
    wrapper.unmount()
  })

  it('removes event listeners on unmount', () => {
    const removeSpy = vi.spyOn(document, 'removeEventListener')
    const wrapper = mount(UserMenu)
    wrapper.unmount()
    expect(removeSpy).toHaveBeenCalledWith('mousedown', expect.any(Function))
    expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
  })
})
