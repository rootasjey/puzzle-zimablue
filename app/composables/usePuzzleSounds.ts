type PuzzleSound = 'move' | 'misplaced' | 'placed' | 'complete'

export function usePuzzleSounds() {
  const accountPreferences = useAccountPreferences()
  const enabled = computed(() => accountPreferences.preferences.value.soundEnabled)
  let context: AudioContext | null = null

  async function toggle() {
    const nextEnabled = !enabled.value
    const saved = await accountPreferences.save({ soundEnabled: nextEnabled })
    if (saved && nextEnabled) void getContext()?.resume()
  }

  function play(sound: PuzzleSound) {
    if (!import.meta.client || !enabled.value) return
    const audio = getContext()
    if (!audio) return
    if (audio.state === 'suspended') void audio.resume()

    const now = audio.currentTime
    const volume = accountPreferences.preferences.value.soundVolume / 100
    if (sound === 'move') {
      tone(audio, 285, now, 0.055, 0.035 * volume, 'triangle')
    } else if (sound === 'misplaced') {
      tone(audio, 190, now, 0.13, 0.045 * volume, 'triangle', 125)
    } else if (sound === 'placed') {
      tone(audio, 620, now, 0.1, 0.04 * volume)
      tone(audio, 840, now + 0.075, 0.13, 0.04 * volume)
    } else {
      ;[523, 659, 784, 1046].forEach((frequency, index) => {
        tone(audio, frequency, now + index * 0.105, 0.2, 0.042 * volume)
      })
    }
  }

  function getContext(): AudioContext | null {
    if (!import.meta.client) return null
    if (context && context.state !== 'closed') return context

    const AudioContextConstructor = window.AudioContext
      ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioContextConstructor) return null

    try {
      context = new AudioContextConstructor()
      return context
    } catch {
      return null
    }
  }

  onBeforeUnmount(() => {
    if (!context || context.state === 'closed') return
    void context.close()
    context = null
  })

  return { enabled, toggle, play }
}

function tone(
  audio: AudioContext,
  frequency: number,
  startAt: number,
  duration: number,
  volume: number,
  type: OscillatorType = 'sine',
  endFrequency?: number,
) {
  const oscillator = audio.createOscillator()
  const gain = audio.createGain()
  oscillator.type = type
  oscillator.frequency.setValueAtTime(frequency, startAt)
  if (endFrequency) oscillator.frequency.linearRampToValueAtTime(endFrequency, startAt + duration)

  gain.gain.setValueAtTime(0.0001, startAt)
  gain.gain.linearRampToValueAtTime(volume, startAt + 0.008)
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration)
  oscillator.connect(gain)
  gain.connect(audio.destination)
  oscillator.start(startAt)
  oscillator.stop(startAt + duration + 0.01)
}
