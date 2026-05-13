import { describe, it, expect, beforeEach, vi } from 'vitest'

const store: Record<string, string> = {}
vi.stubGlobal('localStorage', {
  getItem: vi.fn((key: string) => store[key] ?? null),
  setItem: vi.fn((key: string, val: string) => { store[key] = val }),
  removeItem: vi.fn((key: string) => { delete store[key] }),
})

import { storage } from '~/services/storageService'

describe('storageService', () => {
  beforeEach(() => {
    Object.keys(store).forEach(k => delete store[k])
    vi.clearAllMocks()
  })

  describe('get', () => {
    it('returns null when key absent', () => {
      expect(storage.get('missing')).toBeNull()
    })

    it('returns value with sel: prefix applied', () => {
      store['sel:token'] = 'abc'
      expect(storage.get('token')).toBe('abc')
    })
  })

  describe('set', () => {
    it('writes value under sel: prefix', () => {
      storage.set('token', 'xyz')
      expect(localStorage.setItem).toHaveBeenCalledWith('sel:token', 'xyz')
    })
  })

  describe('remove', () => {
    it('removes key with sel: prefix', () => {
      storage.remove('token')
      expect(localStorage.removeItem).toHaveBeenCalledWith('sel:token')
    })
  })

  describe('getBool', () => {
    it('returns fallback when key absent', () => {
      expect(storage.getBool('flag', true)).toBe(true)
      expect(storage.getBool('flag', false)).toBe(false)
    })

    it('returns true for any value that is not "false"', () => {
      store['sel:flag'] = 'true'
      expect(storage.getBool('flag', false)).toBe(true)
    })

    it('returns false when stored value is "false"', () => {
      store['sel:flag'] = 'false'
      expect(storage.getBool('flag', true)).toBe(false)
    })
  })
})
