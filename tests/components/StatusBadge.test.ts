import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import StatusBadge from '~/components/StatusBadge.vue'

describe('StatusBadge', () => {
  it('displays "Active" with green styling for status "active"', () => {
    const wrapper = mount(StatusBadge, { props: { status: 'active' } })
    expect(wrapper.text()).toBe('Active')
    expect(wrapper.classes().some(c => c.includes('green'))).toBe(true)
  })

  it('displays "Stale" with yellow styling for status "stale"', () => {
    const wrapper = mount(StatusBadge, { props: { status: 'stale' } })
    expect(wrapper.text()).toBe('Stale')
    expect(wrapper.classes().some(c => c.includes('yellow'))).toBe(true)
  })

  it('displays "Inactive" with gray styling for status "inactive"', () => {
    const wrapper = mount(StatusBadge, { props: { status: 'inactive' } })
    expect(wrapper.text()).toBe('Inactive')
    expect(wrapper.classes().some(c => c.includes('gray'))).toBe(true)
  })

  it('renders a <span> element', () => {
    const wrapper = mount(StatusBadge, { props: { status: 'active' } })
    expect(wrapper.element.tagName).toBe('SPAN')
  })
})
