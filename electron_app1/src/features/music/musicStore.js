import { createFileAudioEngine } from './fileAudioEngine'
import { createNoiseEngine } from './noiseAudio'
import {
  MIX_STORAGE_KEY,
  TRACKS,
  WHITE_NOISE_PLAYBACK_RATE,
  clampVolume,
  getOutputGain,
  isGeneratedNoise,
  isLofiPlaylist,
  loadMix,
  pickRandomLofiTrack,
} from './musicCatalog'

/** @type {ReturnType<typeof loadMix>} */
let mix = loadMix()
/** @type {ReturnType<typeof createFileAudioEngine> | null} */
let fileAudio = null
/** @type {ReturnType<typeof createNoiseEngine> | null} */
let noiseEngine = null
/** @type {Record<string, boolean>} */
const lofiPickOnPlay = {}
/** @type {Set<() => void>} */
const listeners = new Set()
let isMuted = false

function getEngines() {
  if (!fileAudio) {
    fileAudio = createFileAudioEngine()
  }
  if (!noiseEngine) {
    noiseEngine = createNoiseEngine()
  }
  return { fileAudio, noiseEngine }
}

function emitChange() {
  for (const listener of listeners) {
    listener()
  }
}

export function subscribe(listener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getMix() {
  return mix
}

export function getIsMuted() {
  return isMuted
}

function getEffectiveOutputGain(trackId, volume) {
  if (isMuted) {
    return 0
  }

  return getOutputGain(trackId, volume)
}

export function toggleMute() {
  isMuted = !isMuted
  emitChange()
  syncMixToAudio()
}

function setMix(nextMix) {
  mix = nextMix
  emitChange()
}

function stopFileTrack(trackId) {
  getEngines().fileAudio.stopTrack(trackId)
}

function startLofiTrack(trackId, { forceNew = false } = {}) {
  const track = TRACKS.find((entry) => entry.id === trackId)
  if (!track?.playlist?.length) {
    return
  }

  const { fileAudio: engine } = getEngines()
  const state = mix[trackId]
  const outputGain = getEffectiveOutputGain(trackId, state.volume)
  const existing = engine.getTrack(trackId)

  if (!forceNew && existing && !existing.audio.ended) {
    engine.setVolume(trackId, outputGain)
    existing.audio.play().catch(() => {})
    return
  }

  const excludeSrc = existing?.src ?? null
  stopFileTrack(trackId)

  const src = pickRandomLofiTrack(excludeSrc)
  if (!src) {
    return
  }

  engine
    .play(trackId, src, {
      loop: false,
      outputGain,
      onEnded: () => {
        if (mix[trackId]?.isPlaying) {
          startLofiTrack(trackId, { forceNew: true })
        }
      },
    })
    .catch(() => {})
}

function syncFileTrack(track) {
  const state = mix[track.id]
  const { fileAudio: engine } = getEngines()

  if (isLofiPlaylist(track)) {
    if (!state.isPlaying) {
      stopFileTrack(track.id)
      return
    }

    if (lofiPickOnPlay[track.id]) {
      lofiPickOnPlay[track.id] = false
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
    engine.pause(track.id)
    return
  }

  engine
    .play(track.id, track.src, {
      loop: true,
      outputGain: getEffectiveOutputGain(track.id, state.volume),
    })
    .catch(() => {})
}

export function syncMixToAudio() {
  const { noiseEngine: noise } = getEngines()

  for (const track of TRACKS) {
    const state = mix[track.id]

    if (isGeneratedNoise(track)) {
      if (state.isPlaying) {
        const options =
          track.kind === 'white-noise'
            ? { playbackRate: WHITE_NOISE_PLAYBACK_RATE }
            : {}
        noise
          .play(track.id, track.kind, getEffectiveOutputGain(track.id, state.volume), options)
          .catch(() => {})
      } else {
        noise.pause(track.id)
      }
      continue
    }

    if (isLofiPlaylist(track) || track.src) {
      syncFileTrack(track)
    }
  }
}

export function toggleTrackPlay(trackId) {
  const track = TRACKS.find((entry) => entry.id === trackId)
  const willPlay = !mix[trackId].isPlaying

  if (willPlay && track && isLofiPlaylist(track)) {
    lofiPickOnPlay[trackId] = true
  }

  setMix({
    ...mix,
    [trackId]: {
      ...mix[trackId],
      isPlaying: willPlay,
    },
  })
}

export function setTrackVolume(trackId, value) {
  setMix({
    ...mix,
    [trackId]: {
      ...mix[trackId],
      volume: clampVolume(value, trackId),
    },
  })
}

export function stopAllTracks() {
  const next = {}
  for (const trackId of Object.keys(mix)) {
    next[trackId] = { ...mix[trackId], isPlaying: false }
  }
  setMix(next)
}

/** Snapshot of the current mix in the shape we persist: volumes only. */
export function getMixPreset() {
  const preset = {}
  for (const track of TRACKS) {
    preset[track.id] = { volume: mix[track.id].volume }
  }
  return preset
}

export function saveMixPreset() {
  localStorage.setItem(MIX_STORAGE_KEY, JSON.stringify(getMixPreset()))
}

/**
 * Overwrite volumes from a synced preset (e.g. fetched from the cloud after
 * login). Playback state stays untouched, and localStorage is updated so the
 * device keeps the synced volumes when offline.
 */
export function applyPresetVolumes(preset) {
  const next = {}
  for (const track of TRACKS) {
    const saved = preset?.[track.id]
    next[track.id] = {
      ...mix[track.id],
      volume:
        saved === undefined
          ? mix[track.id].volume
          : clampVolume(saved.volume, track.id),
    }
  }
  setMix(next)
  saveMixPreset()
}
