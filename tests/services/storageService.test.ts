import { describe, it, expect, beforeEach } from 'vitest'
import { storageService } from '~/services/storageService'

describe('storageService', () => {
  beforeEach(() => localStorage.clear())

  // ── Token ───────────────────────────────────────────────────────────────────

  it('getToken returns null when nothing is stored', () => {
    expect(storageService.getToken()).toBeNull()
  })

  it('setToken / getToken round-trip', () => {
    storageService.setToken('abc123')
    expect(storageService.getToken()).toBe('abc123')
  })

  it('getTokenExpiry returns null when nothing is stored', () => {
    expect(storageService.getTokenExpiry()).toBeNull()
  })

  it('setTokenExpiry / getTokenExpiry round-trip', () => {
    const expiry = Date.now() + 3_600_000
    storageService.setTokenExpiry(expiry)
    expect(storageService.getTokenExpiry()).toBe(expiry)
  })

  it('clearAuth removes token and expiry', () => {
    storageService.setToken('tok')
    storageService.setTokenExpiry(9999)
    storageService.clearAuth()
    expect(storageService.getToken()).toBeNull()
    expect(storageService.getTokenExpiry()).toBeNull()
  })

  // ── Credentials ─────────────────────────────────────────────────────────────

  it('getUsername returns null when nothing is stored', () => {
    expect(storageService.getUsername()).toBeNull()
  })

  it('setUsername / getUsername round-trip', () => {
    storageService.setUsername('testuser')
    expect(storageService.getUsername()).toBe('testuser')
  })

  it('getServerUrl returns null when nothing is stored', () => {
    expect(storageService.getServerUrl()).toBeNull()
  })

  it('setServerUrl / getServerUrl round-trip', () => {
    storageService.setServerUrl('https://192.168.3.2')
    expect(storageService.getServerUrl()).toBe('https://192.168.3.2')
  })

  it('clearCredentials removes username and serverUrl', () => {
    storageService.setUsername('user')
    storageService.setServerUrl('https://test.com')
    storageService.clearCredentials()
    expect(storageService.getUsername()).toBeNull()
    expect(storageService.getServerUrl()).toBeNull()
  })
})
