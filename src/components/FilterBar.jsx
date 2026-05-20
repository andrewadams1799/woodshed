import styles from './FilterBar.module.css'
import { STAGES } from '../data/mockData'

const FILTERS = [
  { id: 'all',      label: 'All Songs' },
  { id: 'idea',     label: 'Idea'      },
  { id: 'lyrics',   label: 'Lyrics'    },
  { id: 'demo',     label: 'Demo'      },
  { id: 'produced', label: 'Produced'  },
  { id: 'done',     label: 'Done'      },
]

const SORTS = [
  { id: 'recent',    label: 'Recent activity' },
  { id: 'title',     label: 'Title A–Z'       },
  { id: 'stage',     label: 'Stage'           },
  { id: 'created',   label: 'Date created'    },
]

export default function FilterBar({ activeFilter, onFilter, sortBy, onSort, counts }) {
  return (
    <div className={styles.bar}>
      <div className={styles.topRow}>
        <div className={styles.filters}>
          {FILTERS.map(f => (
            <button
              key={f.id}
              className={`${styles.pill} ${activeFilter === f.id ? styles.active : ''}`}
              onClick={() => onFilter(f.id)}
            >
              {f.label}
              {counts?.[f.id] != null && (
                <span className={styles.count}>{counts[f.id]}</span>
              )}
            </button>
          ))}
        </div>

        <div className={styles.sort}>
          <label className={styles.sortLabel}>Sort</label>
          <select
            className={styles.sortSelect}
            value={sortBy}
            onChange={e => onSort(e.target.value)}
          >
            {SORTS.map(s => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
