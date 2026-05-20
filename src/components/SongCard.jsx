import { useNavigate } from 'react-router-dom'
import styles from './SongCard.module.css'
import StageBadge from './StageBadge'
import Avatar from './Avatar'
import TimeAgo from './TimeAgo'
import { FILE_TYPES } from '../data/mockData'

export default function SongCard({ song, profiles = {} }) {
  const navigate     = useNavigate()
  const lastActivity = song.activity?.[0]
  const lastProfile  = lastActivity ? profiles[lastActivity.member_id] : null

  const fileCounts = (song.files ?? []).reduce((acc, f) => {
    acc[f.type] = (acc[f.type] ?? 0) + 1
    return acc
  }, {})

  return (
    <article className={styles.card} onClick={() => navigate(`/song/${song.id}`)}>
      <div className={styles.top}>
        <div className={styles.titleRow}>
          <h2 className={styles.title}>{song.title}</h2>
          <StageBadge stage={song.stage} />
        </div>

        {lastActivity && (
          <p className={styles.activity}>
            <Avatar profile={lastProfile} size="sm" />
            <span className={styles.activityText}>
              <strong>{lastProfile?.name ?? 'Someone'}</strong>{' '}
              {lastActivity.action} ·{' '}
              <TimeAgo timestamp={new Date(lastActivity.created_at).getTime()} />
            </span>
          </p>
        )}
      </div>

      <div className={styles.bottom}>
        <div className={styles.files}>
          {Object.entries(fileCounts).map(([type, count]) => (
            <span key={type} className={styles.fileChip}>
              {FILE_TYPES[type]?.icon} {count}
            </span>
          ))}
          {(song.files ?? []).length === 0 && (
            <span className={styles.noFiles}>No files yet</span>
          )}
        </div>

        <div className={styles.meta}>
          {song.key  && <span className={styles.metaTag}>{song.key}</span>}
          {song.bpm  && <span className={styles.metaTag}>{song.bpm} bpm</span>}
        </div>
      </div>
    </article>
  )
}
