/**
 * MP3 / lofi playback via Web Audio API.
 *
 * Plain `HTMLAudioElement.volume` is capped at 1.0, so per-track playback gain
 * above 100% needs a GainNode: slider × TRACK_PLAYBACK_GAIN can exceed 1.
 */

function getAudioContext() {
  const AudioContextClass = window.AudioContext ?? window.webkitAudioContext
  if (!AudioContextClass) {
    return null
  }
  return new AudioContextClass()
}

export function createFileAudioEngine() {
  /** @type {AudioContext | null} */
  let ctx = null
  /** @type {Map<string, { audio: HTMLAudioElement, source: MediaElementAudioSourceNode, gain: GainNode, src: string }>} */
  const tracks = new Map()

  function ensureContext() {
    if (!ctx) {
      ctx = getAudioContext()
    }
    return ctx
  }

  async function resume() {
    const context = ensureContext()
    if (!context) {
      return false
    }
    if (context.state === 'suspended') {
      await context.resume()
    }
    return true
  }

  function setVolume(trackId, outputGain) {
    const track = tracks.get(trackId)
    if (track) {
      track.gain.gain.value = Math.max(0, outputGain)
    }
  }

  async function ensureTrack(trackId, src, { loop = false, onEnded = null } = {}) {
    const ready = await resume()
    if (!ready) {
      return null
    }

    const existing = tracks.get(trackId)
    if (existing && existing.src === src) {
      existing.audio.loop = loop
      existing.audio.onended = onEnded
      return existing
    }

    if (existing) {
      stopTrack(trackId)
    }

    const context = ensureContext()
    if (!context) {
      return null
    }

    const audio = new Audio(src)
    audio.loop = loop
    audio.volume = 1
    audio.onended = onEnded

    const source = context.createMediaElementSource(audio)
    const gain = context.createGain()
    source.connect(gain)
    gain.connect(context.destination)

    const entry = { audio, source, gain, src }
    tracks.set(trackId, entry)
    return entry
  }

  async function play(trackId, src, { loop = false, onEnded = null, outputGain = 1 } = {}) {
    const track = await ensureTrack(trackId, src, { loop, onEnded })
    if (!track) {
      return
    }

    track.gain.gain.value = Math.max(0, outputGain)
    await track.audio.play().catch(() => {})
  }

  function pause(trackId) {
    tracks.get(trackId)?.audio.pause()
  }

  function stopTrack(trackId) {
    const track = tracks.get(trackId)
    if (!track) {
      return
    }

    track.audio.pause()
    track.audio.onended = null

    try {
      track.source.disconnect()
      track.gain.disconnect()
    } catch {
      // Already disconnected.
    }

    tracks.delete(trackId)
  }

  function dispose() {
    for (const trackId of [...tracks.keys()]) {
      stopTrack(trackId)
    }
    if (ctx) {
      ctx.close()
      ctx = null
    }
  }

  function getTrack(trackId) {
    return tracks.get(trackId) ?? null
  }

  return {
    play,
    pause,
    setVolume,
    getTrack,
    stopTrack,
    dispose,
  }
}
