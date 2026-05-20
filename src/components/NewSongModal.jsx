import { useState } from 'react'
import styles from './NewSongModal.module.css'

const STAGES = ['idea', 'lyrics', 'demo', 'produced', 'done']

export default function NewSongModal({ onClose, onCreate }) {
  const [title, setTitle] = useState('')
  const [stage, setStage] = useState('idea')

  function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim()) return
    onCreate({ title: title.trim(), stage })
    onClose()
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.heading}>New Song</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Title</label>
            <input
              autoFocus
              type="text"
              placeholder="Untitled Song"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className={styles.input}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Starting Stage</label>
            <div className={styles.stageGrid}>
              {STAGES.map(s => (
                <button
                  key={s}
                  type="button"
                  className={`${styles.stagePill} ${stage === s ? styles.stageActive : ''}`}
                  onClick={() => setStage(s)}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={styles.submitBtn} disabled={!title.trim()}>
              Create Song
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
