import { readonly, ref, watch, onUnmounted, type Ref } from 'vue'

export function usePolling(callback: () => Promise<void>, interval: Ref<number>) {
  const isPolling = ref(false)
  let timerId: ReturnType<typeof setInterval> | null = null
  let inFlight = false

  function schedule(): void {
    timerId = setInterval(async () => {
      // Concurrent-call guard: skip this tick if the previous poll is still running
      if (inFlight) return
      inFlight = true
      try {
        await callback()
      }
      finally {
        inFlight = false
      }
    }, interval.value)
  }

  function start(): void {
    if (isPolling.value) return
    isPolling.value = true
    schedule()
  }

  function stop(): void {
    if (timerId !== null) {
      clearInterval(timerId)
      timerId = null
    }
    isPolling.value = false
    inFlight = false
  }

  // When the interval changes, restart the timer so the new cadence takes effect immediately
  watch(interval, () => {
    if (!isPolling.value) return
    if (timerId !== null) clearInterval(timerId)
    timerId = null
    schedule()
  })

  // Always clean up on unmount to prevent memory leaks
  onUnmounted(stop)

  return { isPolling: readonly(isPolling), start, stop }
}
