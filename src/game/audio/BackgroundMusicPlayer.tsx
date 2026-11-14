import { useEffect, useRef, useState } from 'react'
import musicUrl from '../../assets/audio/sirahquestbg2.mp3'

const AUDIO_PREFERENCE_KEY = 'sirahQuest.audio.preferences.v1'
const DEFAULT_VOLUME = 0.3

interface AudioPreference {
  muted: boolean
  volume: number
}

function readPreference(): AudioPreference {
  try {
    const parsed = JSON.parse(localStorage.getItem(AUDIO_PREFERENCE_KEY) ?? '') as Partial<AudioPreference>
    return {
      muted: typeof parsed.muted === 'boolean' ? parsed.muted : false,
      volume: typeof parsed.volume === 'number' && parsed.volume >= 0 && parsed.volume <= 1
        ? parsed.volume
        : DEFAULT_VOLUME,
    }
  } catch {
    return { muted: false, volume: DEFAULT_VOLUME }
  }
}

export function BackgroundMusicPlayer() {
  const [preference] = useState(readPreference)
  const [isPlaying, setIsPlaying] = useState(false)
  const [muted, setMuted] = useState(preference.muted)
  const [volume, setVolume] = useState(preference.volume)
  const [message, setMessage] = useState('Sedia untuk dimainkan')
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioCleanupRef = useRef<() => void>(() => undefined)
  const intentPlayingRef = useRef(false)
  const resumeAfterVisibilityRef = useRef(false)

  const ensureAudio = () => {
    if (audioRef.current) return audioRef.current
    const audio = new Audio(musicUrl)
    audio.loop = true
    audio.preload = 'none'
    audio.volume = volume
    audio.muted = muted
    audioRef.current = audio

    const handlePlay = () => {
      setIsPlaying(true)
      setMessage('Muzik sedang dimainkan')
    }
    const handlePause = () => setIsPlaying(false)
    const handleError = () => {
      intentPlayingRef.current = false
      setIsPlaying(false)
      setMessage('Muzik tidak dapat dimuatkan')
    }
    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)
    audio.addEventListener('error', handleError)
    audioCleanupRef.current = () => {
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
      audio.removeEventListener('error', handleError)
      audio.pause()
      audio.removeAttribute('src')
      audio.load()
      audioRef.current = null
    }
    return audio
  }

  useEffect(() => {
    const handleVisibilityChange = () => {
      const audio = audioRef.current
      if (!audio) return
      if (document.hidden) {
        resumeAfterVisibilityRef.current = intentPlayingRef.current && !audio.paused
        audio.pause()
        return
      }
      if (!resumeAfterVisibilityRef.current || !intentPlayingRef.current) return
      resumeAfterVisibilityRef.current = false
      void audio.play().catch(() => {
        intentPlayingRef.current = false
        setMessage('Tekan Main untuk menyambung muzik')
      })
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      audioCleanupRef.current()
    }
  }, [])

  useEffect(() => {
    const audio = audioRef.current
    if (audio) audio.muted = muted
    try { localStorage.setItem(AUDIO_PREFERENCE_KEY, JSON.stringify({ muted, volume })) } catch { /* optional preference */ }
  }, [muted, volume])

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume
  }, [volume])

  const togglePlayback = () => {
    const audio = ensureAudio()
    if (intentPlayingRef.current) {
      intentPlayingRef.current = false
      resumeAfterVisibilityRef.current = false
      audio.pause()
      setMessage('Muzik dijeda')
      return
    }
    intentPlayingRef.current = true
    void audio.play().catch(() => {
      intentPlayingRef.current = false
      setIsPlaying(false)
      setMessage('Main balik melalui kawalan Muzik')
    })
  }

  return (
    <section className="music-player" aria-label="Kawalan muzik latar" data-audio-track="sirahquestbg2.mp3">
      <div>
        <strong>Muzik</strong>
        <small role="status" aria-live="polite">{message}</small>
      </div>
      <button type="button" aria-pressed={isPlaying} onClick={togglePlayback}>
        {isPlaying ? 'Jeda' : 'Main'}
      </button>
      <button type="button" aria-pressed={muted} onClick={() => setMuted((current) => !current)}>
        {muted ? 'Nyahsenyap' : 'Senyap'}
      </button>
      <label>
        <span>Kelantangan</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={volume}
          aria-label="Kelantangan muzik"
          onChange={(event) => setVolume(Number(event.target.value))}
        />
      </label>
    </section>
  )
}

export { AUDIO_PREFERENCE_KEY, DEFAULT_VOLUME, musicUrl as BACKGROUND_MUSIC_URL }
