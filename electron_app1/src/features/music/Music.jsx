import { useEffect, useRef, useState } from 'react'
import {
  BrownNoiseIcon,
  ForestIcon,
  HeadphonesIcon,
  PauseIcon,
  PlayIcon,
  RaindropIcon,
  StopIcon,
  VolumeHighIcon,
  VolumeLowIcon,
  WavesIcon,
  WhiteNoiseIcon,
} from '../../shared/icons'
import './music.css'

const MIX_STORAGE_KEY = 'music-mix'
const DEFAULT_VOLUME = 0.6

/**
 * Static catalog of the sounds we offer. This is the "what exists" list and it
 * never changes at runtime.
 *
 * `src` is the audio file to loop for each sound. It is left `null` for now
 * because no audio assets ship with the app yet. The playback layer below is
 * written to no-op safely when `src` is null, so the whole UI is functional and
 * you only have to drop a file in and set `src` here to make a track audible:
 *
 *   import forestAudio from '../assets/forest.mp3'
 *   { id: 'forest', ..., src: forestAudio }
 */
const TRACKS = [
  { id: 'forest', name: 'Forest', Icon: ForestIcon, src: null },
  { id: 'sea-waves', name: 'Sea Waves', Icon: WavesIcon, src: null },
  { id: 'white-noise', name: 'White Noise', Icon: WhiteNoiseIcon, src: null },
  { id: 'brown-noise', name: 'Brown Noise', Icon: BrownNoiseIcon, src: null },
  { id: 'lofi', name: 'Lofi Music', Icon: HeadphonesIcon, src: null },
  { id: 'rainfall', name: 'Rainfall', Icon: RaindropIcon, src: null },
]

function clampVolume(value) {
  const number = Number(value)
  if (Number.isNaN(number)) {
    return DEFAULT_VOLUME
  }
  return Math.min(1, Math.max(0, number))
}

// The dynamic per-track state ("is it playing" + "how loud"), kept separate
// from the static catalog above. Shape: { [trackId]: { isPlaying, volume } }.
function createDefaultMix() {
  const mix = {}
  for (const track of TRACKS) {
    mix[track.id] = { isPlaying: false, volume: DEFAULT_VOLUME }
  }
  return mix
}

// Rebuild the mix from a saved preset, but always start from a full default so
// that adding/removing a track in TRACKS never breaks an old saved value.
function loadMix() {
  try {
    const stored = localStorage.getItem(MIX_STORAGE_KEY)
    if (!stored) {
      return createDefaultMix()
    }

    const parsed = JSON.parse(stored)
    const mix = createDefaultMix()
    for (const track of TRACKS) {
      const saved = parsed[track.id]
      if (saved) {
        mix[track.id] = {
          isPlaying: Boolean(saved.isPlaying),
          volume: clampVolume(saved.volume),
        }
      }
    }
    return mix
  } catch {
    return createDefaultMix()
  }
}

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
  const [mix, setMix] = useState(loadMix)
  const [savedRecently, setSavedRecently] = useState(false)

  // One <audio> element per track, created lazily and kept across renders.
  const audioElementsRef = useRef({})
  const savedTimeoutRef = useRef(null)

  const activeTracks = TRACKS.filter((track) => mix[track.id].isPlaying)

  // Keep every audio element in sync with the mix. Because multiple tracks can
  // each be playing at once, this is what makes "layered" sound possible.
  useEffect(() => {
    for (const track of TRACKS) {
      if (!track.src) {
        continue
      }

      const state = mix[track.id]
      let audio = audioElementsRef.current[track.id]

      if (!audio) {
        audio = new Audio(track.src)
        audio.loop = true
        audioElementsRef.current[track.id] = audio
      }

      audio.volume = state.volume

      if (state.isPlaying) {
        // play() can reject if the browser blocks autoplay before a user
        // gesture; swallow that so it never crashes the UI.
        audio.play().catch(() => {})
      } else {
        audio.pause()
      }
    }
  }, [mix])

  // Stop all audio when the page unmounts (e.g. user switches to another view).
  useEffect(() => {
    const audioElements = audioElementsRef.current
    return () => {
      for (const audio of Object.values(audioElements)) {
        audio.pause()
      }
      clearTimeout(savedTimeoutRef.current)
    }
  }, [])

  function handleTogglePlay(trackId) {
    setMix((current) => ({
      ...current,
      [trackId]: {
        ...current[trackId],
        isPlaying: !current[trackId].isPlaying,
      },
    }))
  }

  function handleVolumeChange(trackId, value) {
    setMix((current) => ({
      ...current,
      [trackId]: {
        ...current[trackId],
        volume: clampVolume(value),
      },
    }))
  }

  function handleStopAll() {
    setMix((current) => {
      const next = {}
      for (const trackId of Object.keys(current)) {
        next[trackId] = { ...current[trackId], isPlaying: false }
      }
      return next
    })
  }

  function handleSavePreset() {
    localStorage.setItem(MIX_STORAGE_KEY, JSON.stringify(mix))
    setSavedRecently(true)
    clearTimeout(savedTimeoutRef.current)
    savedTimeoutRef.current = setTimeout(() => setSavedRecently(false), 1600)
  }

  return (
    <div className="music">
      <div className="music-body">
        <header className="music-heading">
          <h1 className="music-title">Soundscapes</h1>
          <p className="music-subtitle">Mix your perfect environment</p>
        </header>

        <div className="music-grid">
          {TRACKS.map((track) => (
            <TrackCard
              key={track.id}
              track={track}
              state={mix[track.id]}
              onTogglePlay={handleTogglePlay}
              onVolumeChange={handleVolumeChange}
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
            onClick={handleStopAll}
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
