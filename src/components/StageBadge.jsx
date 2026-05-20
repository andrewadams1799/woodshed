import styles from './StageBadge.module.css'

const STAGE_CONFIG = {
  idea:     { label: 'Idea',     cls: 'idea'     },
  lyrics:   { label: 'Lyrics',   cls: 'lyrics'   },
  demo:     { label: 'Demo',     cls: 'demo'      },
  produced: { label: 'Produced', cls: 'produced'  },
  done:     { label: 'Done',     cls: 'done'      },
}

export default function StageBadge({ stage, size = 'sm' }) {
  const config = STAGE_CONFIG[stage] ?? { label: stage, cls: 'idea' }
  return (
    <span className={`${styles.badge} ${styles[config.cls]} ${styles[size]}`}>
      {config.label}
    </span>
  )
}
