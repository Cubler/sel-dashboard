import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import QualityBadge from '~/components/QualityBadge.vue'

describe('QualityBadge', () => {
  it('displays "Good" with green styling for validity "good"', () => {
    const wrapper = mount(QualityBadge, { props: { validity: 'good' } })
    expect(wrapper.text()).toBe('Good')
    expect(wrapper.classes().some(c => c.includes('green'))).toBe(true)
  })

  it('displays "Questionable" with yellow styling', () => {
    const wrapper = mount(QualityBadge, { props: { validity: 'questionable' } })
    expect(wrapper.text()).toBe('Questionable')
    expect(wrapper.classes().some(c => c.includes('yellow'))).toBe(true)
  })

  it('displays "Invalid" with red styling for validity "invalid"', () => {
    const wrapper = mount(QualityBadge, { props: { validity: 'invalid' } })
    expect(wrapper.text()).toBe('Invalid')
    expect(wrapper.classes().some(c => c.includes('red'))).toBe(true)
  })

  it('falls back to "Invalid" when validity is undefined', () => {
    const wrapper = mount(QualityBadge, { props: { validity: undefined } })
    expect(wrapper.text()).toBe('Invalid')
    expect(wrapper.classes().some(c => c.includes('red'))).toBe(true)
  })

  it('renders a <span> element', () => {
    const wrapper = mount(QualityBadge, { props: { validity: 'good' } })
    expect(wrapper.element.tagName).toBe('SPAN')
  })
})
