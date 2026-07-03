import { useEffect, useRef, useState } from 'react'
import {
  BrownNoiseIcon,
  FireIcon,
  ForestIcon,
  HeadphonesIcon,
  PauseIcon,
  PeopleTalkingIcon,
  PlayIcon,
  RaindropIcon,
  StopIcon,
  VolumeHighIcon,
  VolumeLowIcon,
  WavesIcon,
  WhiteNoiseIcon,
} from '../../shared/icons'
import fireAudio from '../../assets/fire.mp3'
import forestAudio from '../../assets/forest.mp3'
import peopleTalkingAudio from '../../assets/people_talking.mp3'
import rainfallAudio from '../../assets/rainfall.mp3'
import wavesAudio from '../../assets/waves.mp3'
import { createFileAudioEngine } from './fileAudioEngine'
import { createNoiseEngine } from './noiseAudio'
import './music.css'

const lofiModules = import.meta.glob('../../assets/lofi_music/lofi*.mp3', {
  eager: true,
  import: 'default',
})
const LOFI_PLAYLIST = Object.values(lofiModules)

const MIX_STORAGE_KEY = 'music-mix'
const DEFAULT_VOLUME = 0.5
const WHITE_NOISE_PLAYBACK_RATE = 0.72

const TRACK_PLAYBACK_GAIN = {
  'forest': 10,
  'sea-waves': 2,
  'rainfall': 3,
  'fire-chipping': 4,
  'white-noise': 0.15,
  'brown-noise': 0.4,
  'lofi': 1.2,
  'people-talking': 25,
}

/**
 * Static catalog of sounds.
 *
 * `kind` tells the playback layer how to produce audio:
 *   - 'file'            → loop a single MP3 via `src`
 *   - 'lofi-playlist'   → pick a random track from `playlist` on each play
 *   - 'white-noise'     → procedural white noise (Web Audio API)
 *   - 'brown-noise'     → procedural brown noise (Web Audio API)
 */
const TRACKS = [
  {
    id: 'forest',
    name: 'Forest',
    Icon: ForestIcon,
    kind: 'file',
    src: forestAudio,
  },
  {
    id: 'sea-waves',
    name: 'Sea Waves',
    Icon: WavesIcon,
    kind: 'file',
    src: wavesAudio,
  },
  {
    id: 'white-noise',
    name: 'White Noise',
    Icon: WhiteNoiseIcon,
    kind: 'white-noise',
    src: null,
  },
  {
    id: 'brown-noise',
    name: 'Brown Noise',
    Icon: BrownNoiseIcon,
    kind: 'brown-noise',
    src: null,
  },
  {
    id: 'lofi',
    name: 'Lofi Music',
    Icon: HeadphonesIcon,
    kind: 'lofi-playlist',
    playlist: LOFI_PLAYLIST,
    src: null,
  },
  {
    id: 'rainfall',
    name: 'Rainfall',
    Icon: RaindropIcon,
    kind: 'file',
    src: rainfallAudio,
  },
  {
    id: 'fire-chipping',
    name: 'Fire Chipping',
    Icon: FireIcon,
    kind: 'file',
    src: fireAudio,
  },
  {
    id: 'people-talking',
    name: 'People Talking',
    Icon: PeopleTalkingIcon,
    kind: 'file',
    src: peopleTalkingAudio,
  },
]

function isGeneratedNoise(track) {
  return track.kind === 'white-noise' || track.kind === 'brown-noise'
}

function isLofiPlaylist(track) {
  return track.kind === 'lofi-playlist'
}

function getDefaultVolume(trackId) {
  return DEFAULT_VOLUME
}

function getOutputGain(trackId, sliderVolume) {
  const gain = TRACK_PLAYBACK_GAIN[trackId] ?? 1
  return Math.max(0, sliderVolume * gain)
}

function clampVolume(value, trackId) {
  const number = Number(value)
  if (Number.isNaN(number)) {
    return getDefaultVolume(trackId)
  }
  return Math.min(1, Math.max(0, number))
}

function pickRandomLofiTrack(excludeSrc = null) {
  if (LOFI_PLAYLIST.length === 0) {
    return null
  }

  if (LOFI_PLAYLIST.length === 1) {
    return LOFI_PLAYLIST[0]
  }

  let next = LOFI_PLAYLIST[Math.floor(Math.random() * LOFI_PLAYLIST.length)]
  while (next === excludeSrc) {
    next = LOFI_PLAYLIST[Math.floor(Math.random() * LOFI_PLAYLIST.length)]
  }
  return next
}

function createDefaultMix() {
  const mix = {}
  for (const track of TRACKS) {
    mix[track.id] = {
      isPlaying: false,
      volume: getDefaultVolume(track.id),
    }
  }
  return mix
}

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
          volume: clampVolume(saved.volume, track.id),
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

  const fileAudioRef = useRef(null)
  const lofiPickOnPlayRef = useRef({})
  const mixRef = useRef(mix)
  const noiseEngineRef = useRef(null)
  const savedTimeoutRef = useRef(null)

  mixRef.current = mix

  const activeTracks = TRACKS.filter((track) => mix[track.id].isPlaying)

  if (!noiseEngineRef.current) {
    noiseEngineRef.current = createNoiseEngine()
  }

  if (!fileAudioRef.current) {
    fileAudioRef.current = createFileAudioEngine()
  }

  const fileAudio = fileAudioRef.current

  function stopFileTrack(trackId) {
    fileAudio.stopTrack(trackId)
  }

  function startLofiTrack(trackId, { forceNew = false } = {}) {
    const track = TRACKS.find((entry) => entry.id === trackId)
    if (!track?.playlist?.length) {
      return
    }

    const state = mixRef.current[trackId]
    const outputGain = getOutputGain(trackId, state.volume)
    const existing = fileAudio.getTrack(trackId)

    if (!forceNew && existing && !existing.audio.ended) {
      fileAudio.setVolume(trackId, outputGain)
      existing.audio.play().catch(() => {})
      return
    }

    const excludeSrc = existing?.src ?? null
    stopFileTrack(trackId)

    const src = pickRandomLofiTrack(excludeSrc)
    if (!src) {
      return
    }

    fileAudio
      .play(trackId, src, {
        loop: false,
        outputGain,
        onEnded: () => {
          if (mixRef.current[trackId]?.isPlaying) {
            startLofiTrack(trackId, { forceNew: true })
          }
        },
      })
      .catch(() => {})
  }

  function syncFileTrack(track) {
    const state = mix[track.id]

    if (isLofiPlaylist(track)) {
      if (!state.isPlaying) {
        stopFileTrack(track.id)
        return
      }

      if (lofiPickOnPlayRef.current[track.id]) {
        lofiPickOnPlayRef.current[track.id] = false
        startLofiTrack(track.id, { forceNew: true })
        return
      }

      startLofiTrack(track.id)
      return
    }

    if (!track.src) {
      return
    }

    if (!state.isPlaying) {
      fileAudio.pause(track.id)
      return
    }

    fileAudio
      .play(track.id, track.src, {
        loop: true,
        outputGain: getOutputGain(track.id, state.volume),
      })
      .catch(() => {})
  }

  useEffect(() => {
    const noiseEngine = noiseEngineRef.current

    for (const track of TRACKS) {
      const state = mix[track.id]

      if (isGeneratedNoise(track)) {
        if (state.isPlaying) {
          const options =
            track.kind === 'white-noise'
              ? { playbackRate: WHITE_NOISE_PLAYBACK_RATE }
              : {}
          noiseEngine
            .play(
              track.id,
              track.kind,
              getOutputGain(track.id, state.volume),
              options,
            )
            .catch(() => {})
        } else {
          noiseEngine.pause(track.id)
        }
        continue
      }

      if (isLofiPlaylist(track) || track.src) {
        syncFileTrack(track)
      }
    }
  }, [mix])

  useEffect(() => {
    const fileAudioEngine = fileAudioRef.current
    const noiseEngine = noiseEngineRef.current

    return () => {
      fileAudioEngine?.dispose()
      noiseEngine?.dispose()
      clearTimeout(savedTimeoutRef.current)
    }
  }, [])

  function handleTogglePlay(trackId) {
    const track = TRACKS.find((entry) => entry.id === trackId)
    const willPlay = !mix[trackId].isPlaying

    if (willPlay && track && isLofiPlaylist(track)) {
      lofiPickOnPlayRef.current[trackId] = true
    }

    setMix((current) => ({
      ...current,
      [trackId]: {
        ...current[trackId],
        isPlaying: willPlay,
      },
    }))
  }

  function handleVolumeChange(trackId, value) {
    setMix((current) => ({
      ...current,
      [trackId]: {
        ...current[trackId],
        volume: clampVolume(value, trackId),
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
