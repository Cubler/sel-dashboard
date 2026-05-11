import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { reactive } from 'vue'

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockLogin = vi.fn()
// Use reactive() so Vue unwraps properties in templates
const mockPollingState = reactive({
  authLoading: false,
  authError: null as { message: string } | null,
  login: mockLogin,
  init: vi.fn(), // needed by auth.client.ts plugin
  logout: vi.fn(),
})

vi.mock('~/composables/useSymbolPolling', () => ({
  useSymbolPolling: () => mockPollingState,
}))

// Prevent theme.client.ts plugin from crashing when it calls prefs.init()
vi.mock('~/stores/preferences', () => ({
  usePreferencesStore: () => ({ theme: 'auto', autoStartPolling: true, init: vi.fn(), applyTheme: vi.fn() }),
}))

const mockRouterPush = vi.fn()
vi.mock('vue-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue-router')>()
  return {
    ...actual,
    useRouter: () => ({
      push: mockRouterPush,
      afterEach: vi.fn(),
      beforeEach: vi.fn(),
      replace: vi.fn(),
    }),
  }
})

// ── Import after mocks ─────────────────────────────────────────────────────────

import LoginForm from '~/components/LoginForm.vue'

// ── Helpers ────────────────────────────────────────────────────────────────────

function mountForm() {
  return mount(LoginForm, { attachTo: document.body })
}

async function fillForm(
  wrapper: ReturnType<typeof mountForm>,
  url = 'https://192.168.3.2',
  username = 'testuser',
  password = 'testpass',
) {
  await wrapper.find('#serverUrl').setValue(url)
  await wrapper.find('#username').setValue(username)
  await wrapper.find('#password').setValue(password)
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPollingState.authLoading = false
    mockPollingState.authError = null
    mockLogin.mockResolvedValue(true)
  })

  it('renders the three required input fields', () => {
    const wrapper = mountForm()
    expect(wrapper.find('#serverUrl').exists()).toBe(true)
    expect(wrapper.find('#username').exists()).toBe(true)
    expect(wrapper.find('#password').exists()).toBe(true)
  })

  it('shows an error when Server URL is empty', async () => {
    const wrapper = mountForm()
    // The field defaults to 'https://192.168.3.2' — clear it first
    await wrapper.find('#serverUrl').setValue('')
    await wrapper.find('form').trigger('submit')
    expect(wrapper.text()).toContain('Server URL is required')
  })

  it('shows an error when Server URL format is invalid', async () => {
    const wrapper = mountForm()
    await wrapper.find('#serverUrl').setValue('not-a-url')
    await wrapper.find('#username').setValue('user')
    await wrapper.find('#password').setValue('pass')
    await wrapper.find('form').trigger('submit')
    expect(wrapper.text()).toContain('valid URL')
  })

  it('shows an error when username is empty', async () => {
    const wrapper = mountForm()
    await wrapper.find('#serverUrl').setValue('https://test.com')
    await wrapper.find('#password').setValue('pass')
    await wrapper.find('form').trigger('submit')
    expect(wrapper.text()).toContain('Username is required')
  })

  it('shows an error when password is empty', async () => {
    const wrapper = mountForm()
    await wrapper.find('#serverUrl').setValue('https://test.com')
    await wrapper.find('#username').setValue('user')
    await wrapper.find('form').trigger('submit')
    expect(wrapper.text()).toContain('Password is required')
  })

  it('calls login with the correct credentials on valid submit', async () => {
    const wrapper = mountForm()
    await fillForm(wrapper)
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(mockLogin).toHaveBeenCalledWith({
      serverUrl: 'https://192.168.3.2',
      username: 'testuser',
      password: 'testpass',
    })
  })

  it('navigates to /dashboard after successful login', async () => {
    const wrapper = mountForm()
    await fillForm(wrapper)
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(mockRouterPush).toHaveBeenCalledWith('/dashboard')
  })

  it('displays the auth error message', async () => {
    mockPollingState.authError = { message: 'Invalid credentials' }
    const wrapper = mountForm()
    await flushPromises()
    expect(wrapper.text()).toContain('Invalid credentials')
  })

  it('disables the submit button while loading', async () => {
    mockPollingState.authLoading = true
    const wrapper = mountForm()
    const btn = wrapper.find('button[type="submit"]')
    expect(btn.attributes('disabled')).toBeDefined()
  })

  it('does not log credentials to the console', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const wrapper = mountForm()
    await fillForm(wrapper, 'https://192.168.3.2', 'secretuser', 'secretpass')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    const logged = logSpy.mock.calls.map(c => c.join(' ')).join(' ')
    expect(logged).not.toContain('secretpass')
    expect(logged).not.toContain('secretuser')
    logSpy.mockRestore()
  })
})
