import { useState } from 'react'
import { supabase } from '../lib/supabase'
import styles from './LoginPage.module.css'

export default function LoginPage() {
  const [email,   setEmail]   = useState('')
  const [code,    setCode]    = useState('')
  const [step,    setStep]    = useState('email') // 'email' | 'code'
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSendCode(e) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true },
    })
    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      setStep('code')
    }
  }

  async function handleVerifyCode(e) {
    e.preventDefault()
    if (code.trim().length < 6) return
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: 'email',
    })
    setLoading(false)
    if (error) {
      setError('Invalid or expired code. Try requesting a new one.')
    }
    // on success, AuthContext onAuthStateChange handles the redirect
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <span className={styles.logo}>♩</span>
          <span className={styles.name}>Woodshed</span>
        </div>

        {step === 'email' ? (
          <>
            <div className={styles.header}>
              <h1 className={styles.heading}>Sign in</h1>
              <p className={styles.sub}>Enter your email and we'll send you a 6-digit code.</p>
            </div>

            <form onSubmit={handleSendCode} className={styles.form}>
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
                {loading ? 'Sending…' : 'Send code'}
              </button>
            </form>
          </>
        ) : (
          <>
            <div className={styles.header}>
              <h1 className={styles.heading}>Check your email</h1>
              <p className={styles.sub}>
                We sent a 6-digit code to <strong>{email}</strong>. Enter it below.
              </p>
            </div>

            <form onSubmit={handleVerifyCode} className={styles.form}>
              <input
                autoFocus
                type="text"
                inputMode="numeric"
                placeholder="123456"
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                className={`${styles.input} ${styles.codeInput}`}
                maxLength={8}
                required
              />
              {error && <p className={styles.error}>{error}</p>}
              <button
                type="submit"
                className={styles.submitBtn}
                disabled={loading || code.trim().length < 6}
              >
                {loading ? 'Verifying…' : 'Sign in'}
              </button>
              <button
                type="button"
                className={styles.resend}
                onClick={() => { setStep('email'); setCode(''); setError('') }}
              >
                Use a different email
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
