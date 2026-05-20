import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import styles from './LoginPage.module.css'

export default function LoginPage() {
  const { signIn } = useAuth()
  const [email,  setEmail]  = useState('')
  const [sent,   setSent]   = useState(false)
  const [error,  setError]  = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError('')
    const { error } = await signIn(email.trim())
    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <span className={styles.logo}>♩</span>
          <span className={styles.name}>Woodshed</span>
        </div>

        {sent ? (
          <div className={styles.sent}>
            <div className={styles.sentIcon}>✉️</div>
            <h2 className={styles.sentTitle}>Check your email</h2>
            <p className={styles.sentText}>
              We sent a magic link to <strong>{email}</strong>.
              Tap it and you're in — no password needed.
            </p>
            <button className={styles.resend} onClick={() => setSent(false)}>
              Use a different email
            </button>
          </div>
        ) : (
          <>
            <div className={styles.header}>
              <h1 className={styles.heading}>Sign in</h1>
              <p className={styles.sub}>Enter your email and we'll send you a link.</p>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              <input
                autoFocus
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className={styles.input}
                required
              />
              {error && <p className={styles.error}>{error}</p>}
              <button
                type="submit"
                className={styles.submitBtn}
                disabled={loading || !email.trim()}
              >
                {loading ? 'Sending…' : 'Send magic link'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
