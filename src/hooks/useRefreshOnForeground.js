import { useEffect, useRef } from 'react'

/**
 * Re-runs `callback` whenever the app/PWA comes back to the foreground —
 * covers cases the normal React re-render/remount cycle misses, like the
 * OS suspending the page in the background (app switcher, screen off,
 * switching to another app) and then resuming it without a full reload.
 *
 * Without this, a screen can keep showing data from before the app was
 * backgrounded (e.g. a PR trophy that doesn't reflect a set just logged
 * on the way back to this screen) until the user manually navigates away
 * and back.
 */
export function useRefreshOnForeground(callback) {
  const cbRef = useRef(callback)
  cbRef.current = callback

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') cbRef.current?.()
    }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onVisible)
    window.addEventListener('pageshow', onVisible)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onVisible)
      window.removeEventListener('pageshow', onVisible)
    }
  }, [])
}
