import {
  BrownNoiseIcon,
  FireIcon,
  ForestIcon,
  HeadphonesIcon,
  PeopleTalkingIcon,
  RaindropIcon,
  WavesIcon,
  WhiteNoiseIcon,
} from '../../shared/icons'
import fireAudio from '../../assets/fire.mp3'
import forestAudio from '../../assets/forest.mp3'
import peopleTalkingAudio from '../../assets/people_talking.mp3'
import rainfallAudio from '../../assets/rainfall.mp3'
import wavesAudio from '../../assets/waves.mp3'

const lofiModules = import.meta.glob('../../assets/lofi_music/lofi*.mp3', {
  eager: true,
  import: 'default',
})

export const LOFI_PLAYLIST = Object.values(lofiModules)
export const MIX_STORAGE_KEY = 'music-mix'
export const DEFAULT_VOLUME = 0.5
export const WHITE_NOISE_PLAYBACK_RATE = 0.72

export const TRACK_PLAYBACK_GAIN = {
  forest: 10,
  'sea-waves': 2,
  rainfall: 5,
  'fire-chipping': 4,
  'white-noise': 0.15,
  'brown-noise': 0.4,
  lofi: 1.2,
  'people-talking': 25,
}

export const TRACKS = [
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

export function isGeneratedNoise(track) {
  return track.kind === 'white-noise' || track.kind === 'brown-noise'
}

export function isLofiPlaylist(track) {
  return track.kind === 'lofi-playlist'
}

export function getDefaultVolume() {
  return DEFAULT_VOLUME
}

export function getOutputGain(trackId, sliderVolume) {
  const gain = TRACK_PLAYBACK_GAIN[trackId] ?? 1
  return Math.max(0, sliderVolume * gain)
}

export function clampVolume(value, trackId) {
  const number = Number(value)
  if (Number.isNaN(number)) {
    return getDefaultVolume(trackId)
  }
  return Math.min(1, Math.max(0, number))
}

export function pickRandomLofiTrack(excludeSrc = null) {
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

export function createDefaultMix() {
  const mix = {}
  for (const track of TRACKS) {
    mix[track.id] = {
      isPlaying: false,
      volume: getDefaultVolume(track.id),
    }
  }
  return mix
}

export function loadMix() {
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
          isPlaying: false,
          volume: clampVolume(saved.volume, track.id),
        }
      }
    }
    return mix
  } catch {
    return createDefaultMix()
  }
}
