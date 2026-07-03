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
  saveMixPreset,
  setTrackVolume,
  stopAllTracks,
  subscribe,
  toggleTrackPlay,
} from './musicStore'
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
          aria-label={`${state.isPlaying ? 'Pause' : 'Play'} ${track.name}`}
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
          aria-label={`${track.name} volume`}
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
  const [savedRecently, setSavedRecently] = useState(false)
  const savedTimeoutRef = useRef(null)

  const activeTracks = TRACKS.filter((track) => mix[track.id].isPlaying)

  function handleSavePreset() {
    saveMixPreset()
    setSavedRecently(true)
    window.clearTimeout(savedTimeoutRef.current)
    savedTimeoutRef.current = window.setTimeout(() => {
      setSavedRecently(false)
    }, 1600)
  }

  return (
    <div className="music">
      <div className="music-body">
        <header className="music-heading">
          <DigitalClock />
          <h1 className="music-title">Soundscapes</h1>
          <p className="music-subtitle">Mix your perfect environment</p>
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
          <span className="music-mix-label">Active mix</span>
          <span className="music-mix-count">
            {activeTracks.length} sound{activeTracks.length === 1 ? '' : 's'}{' '}
            layered
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
            Stop All
          </button>
          <button
            type="button"
            className="music-save-btn"
            onClick={handleSavePreset}
          >
            {savedRecently ? 'Saved' : 'Save Preset'}
          </button>
        </div>
      </footer>
    </div>
  )
}
