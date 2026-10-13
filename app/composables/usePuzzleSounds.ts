type PuzzleSound = 'move' | 'misplaced' | 'placed' | 'complete'

const STORAGE_KEY = 'puzzle-zimablue:sounds-enabled'

export function usePuzzleSounds() {
  const enabled = useState<boolean>('puzzle-sounds-enabled', () => true)
  let context: AudioContext | null = null

  onMounted(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved !== null) enabled.value = saved === 'true'
    } catch {
      // Sound remains enabled for this visit when storage is unavailable.
    }
  })

  watch(enabled, (isEnabled) => {
    if (!import.meta.client) return
    try {
      localStorage.setItem(STORAGE_KEY, String(isEnabled))
    } catch {
      // The in-memory preference still works when storage is unavailable.
    }
  })

  function toggle() {
    enabled.value = !enabled.value
    if (enabled.value) void getContext()?.resume()
  }

  function play(sound: PuzzleSound) {
    if (!import.meta.client || !enabled.value) return
    const audio = getContext()
    if (!audio) return
    if (audio.state === 'suspended') void audio.resume()

    const now = audio.currentTime
    if (sound === 'move') {
      tone(audio, 285, now, 0.055, 0.035, 'triangle')
    } else if (sound === 'misplaced') {
      tone(audio, 190, now, 0.13, 0.045, 'triangle', 125)
    } else if (sound === 'placed') {
      tone(audio, 620, now, 0.1, 0.04)
      tone(audio, 840, now + 0.075, 0.13, 0.04)
    } else {
      ;[523, 659, 784, 1046].forEach((frequency, index) => {
        tone(audio, frequency, now + index * 0.105, 0.2, 0.042)
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
