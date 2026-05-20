import styles from './Avatar.module.css'
import { initials } from '../data/mockData'

export default function Avatar({ profile, size = 'sm' }) {
  if (!profile) return (
    <span className={`${styles.avatar} ${styles[size]}`} style={{ background: '#ccc' }}>?</span>
  )
  return (
    <span
      className={`${styles.avatar} ${styles[size]}`}
      style={{ background: profile.color ?? '#2563eb' }}
      title={profile.name}
    >
      {initials(profile.name)}
    </span>
  )
}
