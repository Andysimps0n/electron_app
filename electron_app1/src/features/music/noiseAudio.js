/**
 * Procedural white / brown noise via the Web Audio API.
 *
 * Why not MP3 files? Noise loops need seamless edges; generated buffers loop
 * cleanly. White noise is random samples; brown noise integrates those samples
 * so energy drops at higher frequencies (deeper, softer hiss).
 *
 * Each playing track gets its own AudioContext branch: BufferSource → GainNode
 * → destination. BufferSource can only be started once, so "pause" tears down the
 * source and "play" creates a fresh one.
 */

const NOISE_BUFFER_SECONDS = 2

function getAudioContext() {
  const AudioContextClass = window.AudioContext ?? window.webkitAudioContext
  if (!AudioContextClass) {
    return null
  }
  return new AudioContextClass()
}

function fillWhiteNoiseBuffer(ctx) {
  const sampleRate = ctx.sampleRate
  const length = sampleRate * NOISE_BUFFER_SECONDS
  const buffer = ctx.createBuffer(2, length, sampleRate)

  for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
    const samples = buffer.getChannelData(channel)
    for (let i = 0; i < length; i++) {
      samples[i] = Math.random() * 2 - 1
    }
  }

  return buffer
}

function fillBrownNoiseBuffer(ctx) {
  const sampleRate = ctx.sampleRate
  const length = sampleRate * NOISE_BUFFER_SECONDS
  const buffer = ctx.createBuffer(2, length, sampleRate)

  for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
    const samples = buffer.getChannelData(channel)
    let lastOut = 0

    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1
      // Integrate white noise and bleed off DC so it doesn't drift forever.
      lastOut = (lastOut + 0.02 * white) / 1.02
      samples[i] = lastOut * 3.5
    }
  }

  return buffer
}

function createNoiseBuffer(ctx, kind) {
  return kind === 'brown-noise'
    ? fillBrownNoiseBuffer(ctx)
    : fillWhiteNoiseBuffer(ctx)
}

export function createNoiseEngine() {
  /** @type {AudioContext | null} */
  let ctx = null
  /** @type {Map<string, { source: AudioBufferSourceNode, gain: GainNode }>} */
  const active = new Map()

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

  function stopTrack(trackId) {
    const track = active.get(trackId)
    if (!track) {
      return
    }

    try {
      track.source.stop()
    } catch {
      // Already stopped.
    }

    track.source.disconnect()
    track.gain.disconnect()
    active.delete(trackId)
  }

  return {
    async play(trackId, kind, volume, { playbackRate = 1 } = {}) {
      const context = ensureContext()
      if (!context) {
        return
      }

      await resume()

      // Reuse the running source when only volume changed.
      const existing = active.get(trackId)
      if (existing) {
        existing.gain.gain.value = volume
        return
      }

      const gain = context.createGain()
      gain.gain.value = volume
      gain.connect(context.destination)

      const source = context.createBufferSource()
      source.buffer = createNoiseBuffer(context, kind)
      source.loop = true
      source.playbackRate.value = playbackRate
      source.connect(gain)
      source.start(0)

      active.set(trackId, { source, gain })
    },

    setVolume(trackId, volume) {
      const track = active.get(trackId)
      if (track) {
        track.gain.gain.value = volume
      }
    },

    pause(trackId) {
      stopTrack(trackId)
    },

    stopAll() {
      for (const trackId of [...active.keys()]) {
        stopTrack(trackId)
      }
    },

    dispose() {
      this.stopAll()
      if (ctx) {
        ctx.close()
        ctx = null
      }
    },
  }
}
