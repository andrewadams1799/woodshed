import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import styles from './SetupPage.module.css'

const COLORS = [
  '#2563eb', '#10b981', '#f59e0b', '#8b5cf6',
  '#ef4444', '#ec4899', '#0ea5e9', '#14b8a6',
]

export default function SetupPage() {
  const { createProfile } = useAuth()
  const [name,    setName]    = useState('')
  const [color,   setColor]   = useState(COLORS[0])
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    setError('')
    try {
      const { error } = await createProfile(name.trim(), color)
      if (error) setError(error.message || JSON.stringify(error))
      // On success: setProfile was called → AppRoutes navigates to Dashboard
    } catch (err) {
      setError(err.message || 'Unexpected error — check the console')
    } finally {
      setSaving(false)
    }
  }

  const preview = name.trim()
    ? name.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <span className={styles.logo}>♩</span>
          <span className={styles.name}>Woodshed</span>
        </div>

        <div className={styles.header}>
          <h1 className={styles.heading}>Set up your profile</h1>
          <p className={styles.sub}>This is how your bandmates will see you.</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.previewRow}>
            <span
              className={styles.avatarPreview}
              style={{ background: color }}
            >
              {preview}
            </span>
            <span className={styles.previewName}>{name || 'Your name'}</span>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Your name</label>
            <input
              autoFocus
              type="text"
              placeholder="e.g. Andrew"
              value={name}
              onChange={e => setName(e.target.value)}
              className={styles.input}
              maxLength={40}
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Pick a color</label>
            <div className={styles.colorGrid}>
              {COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  className={`${styles.colorSwatch} ${color === c ? styles.colorActive : ''}`}
                  style={{ background: c }}
                  onClick={() => setColor(c)}
                  aria-label={c}
                />
              ))}
            </div>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={saving || !name.trim()}
          >
            {saving ? 'Saving…' : 'Let\'s go'}
          </button>
        </form>
      </div>
    </div>
  )
}
