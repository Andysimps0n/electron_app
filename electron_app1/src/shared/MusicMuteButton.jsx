import { useSyncExternalStore } from 'react'
import { VolumeHighIcon, VolumeMuteIcon } from './icons'
import { getIsMuted, subscribe, toggleMute } from '../features/music/musicStore'
import './musicMuteButton.css'

export default function MusicMuteButton() {
  const isMuted = useSyncExternalStore(subscribe, getIsMuted, getIsMuted)

  return (
    <button
      type="button"
      className={`music-mute-btn${isMuted ? ' music-mute-btn-active' : ''}`}
      aria-label={isMuted ? '음악 음소거 해제' : '음악 음소거'}
      aria-pressed={isMuted}
      onClick={toggleMute}
    >
      {isMuted ? (
        <VolumeMuteIcon width={18} height={18} />
      ) : (
        <VolumeHighIcon width={18} height={18} />
      )}
    </button>
  )
}
