import { useState } from 'react'
import styles from './Header.module.css'

export default function Header({ onSearch, onAddSong, children }) {
  const [query, setQuery] = useState('')

  function handleChange(e) {
    setQuery(e.target.value)
    onSearch?.(e.target.value)
  }

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <span className={styles.logo}>♩</span>
          <span className={styles.name}>Woodshed</span>
        </div>

        <div className={styles.search}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className={styles.searchIcon}>
            <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            placeholder="Search songs…"
            value={query}
            onChange={handleChange}
            className={styles.searchInput}
          />
        </div>

        <button className={styles.addBtn} onClick={onAddSong}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
          </svg>
          New Song
        </button>

        {children}
      </div>
    </header>
  )
}
