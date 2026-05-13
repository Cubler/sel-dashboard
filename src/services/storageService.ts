const PREFIX = 'sel:'

export const storage = {
  get(key: string): string | null {
    return localStorage.getItem(PREFIX + key)
  },

  set(key: string, value: string): void {
    localStorage.setItem(PREFIX + key, value)
  },

  remove(key: string): void {
    localStorage.removeItem(PREFIX + key)
  },

  getBool(key: string, fallback: boolean): boolean {
    const v = localStorage.getItem(PREFIX + key)
    return v === null ? fallback : v !== 'false'
  },
}
