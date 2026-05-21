import { useRef, useState, useEffect } from 'react'
import styles from './AudioPlayer.module.css'

function formatTime(secs) {
  if (!secs || isNaN(secs)) return '0:00'
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function AudioPlayer({ track, onClose }) {
  const audioRef  = useRef()
  const [playing,     setPlaying]     = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration,    setDuration]    = useState(0)
  const [loading,     setLoading]     = useState(true)

  useEffect(() => {
    setCurrentTime(0)
    setDuration(0)
    setLoading(true)
    setPlaying(false)
  }, [track.url])

  function togglePlay() {
    if (!audioRef.current) return
    if (audioRef.current.paused) {
      audioRef.current.play()
      setPlaying(true)
    } else {
      audioRef.current.pause()
      setPlaying(false)
    }
  }

  function handleSeek(e) {
    const t = Number(e.target.value)
    if (audioRef.current) audioRef.current.currentTime = t
    setCurrentTime(t)
  }

  function handleLoadedMetadata() {
    setDuration(audioRef.current.duration)
    setLoading(false)
    audioRef.current.play()
    setPlaying(true)
  }

  function handleEnded() {
    setPlaying(false)
    setCurrentTime(0)
  }

  const progress = duration ? (currentTime / duration) * 100 : 0

  return (
    <div className={styles.player}>
      <audio
        ref={audioRef}
        src={track.url}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime ?? 0)}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        preload="metadata"
      />

      {/* Seek bar */}
      <div className={styles.seekWrap}>
        <input
          type="range"
          className={styles.seek}
          min={0}
          max={duration || 100}
          step={0.1}
          value={currentTime}
          onChange={handleSeek}
          disabled={loading}
          style={{ '--progress': `${progress}%` }}
        />
      </div>

      {/* Controls row */}
      <div className={styles.row}>
        <button
          className={styles.playBtn}
          onClick={togglePlay}
          disabled={loading}
          aria-label={playing ? 'Pause' : 'Play'}
        >
          {loading ? (
            <span className={styles.spinner} />
          ) : playing ? (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <rect x="2" y="2" width="4" height="12" rx="1"/>
              <rect x="10" y="2" width="4" height="12" rx="1"/>
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M4 2.5l10 5.5-10 5.5V2.5z"/>
            </svg>
          )}
        </button>

        <div className={styles.info}>
          <span className={styles.filename}>{track.name}</span>
          <span className={styles.time}>
            {loading ? '—' : `${formatTime(currentTime)} / ${formatTime(duration)}`}
          </span>
        </div>

        <button className={styles.closeBtn} onClick={onClose} aria-label="Close player">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
