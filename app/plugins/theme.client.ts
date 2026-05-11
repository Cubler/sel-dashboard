// Applies the persisted theme to <html> before the first render so there
// is no flash of the wrong theme on page load.
export default defineNuxtPlugin(() => {
  const prefs = usePreferencesStore()
  prefs.init()
})
