import { useEffect, useSyncExternalStore } from 'react'
import { getMix, subscribe, syncMixToAudio } from './musicStore'

/**
 * Keeps audio playback alive while the Music view is unmounted.
 * Mount once at the app root; Music.jsx only renders controls.
 */
export default function MusicPlayerHost() {
  const mix = useSyncExternalStore(subscribe, getMix, getMix)

  useEffect(() => {
    syncMixToAudio()
  }, [mix])

  return null
}
