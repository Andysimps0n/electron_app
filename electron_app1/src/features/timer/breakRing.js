/**
 * Short bell chime when a pomodoro focus block ends and break begins.
 * Uses Web Audio so we don't need a separate sound file.
 */

let ctx = null

function ensureContext() {
  const AudioContextClass = window.AudioContext ?? window.webkitAudioContext
  if (!AudioContextClass) {
    return null
  }

  if (!ctx) {
    ctx = new AudioContextClass()
  }
  return ctx
}

function playChime(context, startTime, frequency, peakGain = 0.45) {
  const osc = context.createOscillator()
  const gain = context.createGain()

  osc.type = 'sine'
  osc.frequency.setValueAtTime(frequency, startTime)

  gain.gain.setValueAtTime(0, startTime)
  gain.gain.linearRampToValueAtTime(peakGain, startTime + 0.015)
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.9)

  osc.connect(gain)
  gain.connect(context.destination)

  osc.start(startTime)
  osc.stop(startTime + 0.95)
}

export async function playBreakRing() {
  const context = ensureContext()
  if (!context) {
    return
  }

  if (context.state === 'suspended') {
    await context.resume()
  }

  const start = context.currentTime
  const frequencies = [880, 988, 1175]

  frequencies.forEach((frequency, index) => {
    playChime(context, start + index * 0.38, frequency)
  })
}
