import { useRef, useState, useSyncExternalStore } from 'react'
import {
  PauseIcon,
  PlayIcon,
  StopIcon,
  VolumeHighIcon,
  VolumeLowIcon,
} from '../../shared/icons'
import DigitalClock from '../../shared/DigitalClock'
import { TRACKS } from './musicCatalog'
import {
  getMix,
  setTrackVolume,
  stopAllTracks,
  subscribe,
  toggleTrackPlay,
} from './musicStore'
import { saveMixPresetEverywhere } from '../sync/musicPresetSync'
import './music.css'

function TrackCard({ track, state, onTogglePlay, onVolumeChange }) {
  const TrackIcon = track.Icon
  const volumePercent = Math.round(state.volume * 100)

  return (
    <article
      className={`music-card${state.isPlaying ? ' music-card-active' : ''}`}
    >
      <div className="music-card-top">
        <span className="music-card-icon">
          <TrackIcon width={26} height={26} />
        </span>
        <button
          type="button"
          className="music-play-btn"
          aria-label={`${state.isPlaying ? '일시정지' : '재생'} ${track.name}`}
          aria-pressed={state.isPlaying}
          onClick={() => onTogglePlay(track.id)}
        >
          {state.isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>
      </div>

      <h2 className="music-card-name">{track.name}</h2>

      <div className="music-card-volume">
        <VolumeLowIcon width={14} height={14} />
        <input
          type="range"
          className="music-volume-slider"
          min="0"
          max="1"
          step="0.01"
          value={state.volume}
          aria-label={`${track.name} 볼륨`}
          style={{ '--fill': `${volumePercent}%` }}
          onChange={(event) => onVolumeChange(track.id, event.target.value)}
        />
        <VolumeHighIcon width={14} height={14} />
      </div>
    </article>
  )
}

export default function Music() {
  const mix = useSyncExternalStore(subscribe, getMix, getMix)
  const [savedStatus, setSavedStatus] = useState(null)
  const savedTimeoutRef = useRef(null)

  const activeTracks = TRACKS.filter((track) => mix[track.id].isPlaying)

  async function handleSavePreset() {
    let status = 'local'
    try {
      status = await saveMixPresetEverywhere()
    } catch {
      // localStorage save already happened; a cloud failure still means
      // the preset is safe on this device.
    }
    setSavedStatus(status)
    window.clearTimeout(savedTimeoutRef.current)
    savedTimeoutRef.current = window.setTimeout(() => {
      setSavedStatus(null)
    }, 1600)
  }

  return (
    <div className="music">
      <div className="music-body">
        <header className="music-heading">
          <DigitalClock />
          <h1 className="music-title">음악 재생</h1>
        </header>

        <div className="music-grid">
          {TRACKS.map((track) => (
            <TrackCard
              key={track.id}
              track={track}
              state={mix[track.id]}
              onTogglePlay={toggleTrackPlay}
              onVolumeChange={setTrackVolume}
            />
          ))}
        </div>
      </div>

      <footer className="music-mixbar">
        <div className="music-mix-summary">
          <span className="music-mix-count">
            {activeTracks.length}개 사운드 레이어
          </span>
        </div>

        <div className="music-mix-chips">
          {activeTracks.map((track) => {
            const TrackIcon = track.Icon
            return (
              <span key={track.id} className="music-chip">
                <TrackIcon width={12} height={12} />
                {track.name}
                <span className="music-chip-dot" aria-hidden="true" />
              </span>
            )
          })}
        </div>

        <div className="music-mix-actions">
          <button
            type="button"
            className="music-stop-btn"
            onClick={stopAllTracks}
            disabled={activeTracks.length === 0}
          >
            <StopIcon width={14} height={14} />
            모두 정지
          </button>
          <button
            type="button"
            className="music-save-btn"
            onClick={handleSavePreset}
          >
            {savedStatus === null
              ? '프리셋 저장'
              : savedStatus === 'synced'
                ? '저장 및 동기화됨'
                : '로컬에 저장됨'}
          </button>
        </div>
      </footer>
    </div>
  )
}
