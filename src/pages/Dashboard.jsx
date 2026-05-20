import { useState, useMemo, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './Dashboard.module.css'
import Header from '../components/Header'
import FilterBar from '../components/FilterBar'
import SongCard from '../components/SongCard'
import NewSongModal from '../components/NewSongModal'
import Avatar from '../components/Avatar'
import { STAGES } from '../data/mockData'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

function sortSongs(songs, sortBy) {
  return [...songs].sort((a, b) => {
    if (sortBy === 'title')   return a.title.localeCompare(b.title)
    if (sortBy === 'stage')   return STAGES.findIndex(s => s.id === a.stage) - STAGES.findIndex(s => s.id === b.stage)
    if (sortBy === 'created') return new Date(b.created_at) - new Date(a.created_at)
    const aLatest = a.activity?.[0]?.created_at ?? a.created_at
    const bLatest = b.activity?.[0]?.created_at ?? b.created_at
    return new Date(bLatest) - new Date(aLatest)
  })
}

export default function Dashboard() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  const [songs,       setSongs]       = useState([])
  const [profiles,    setProfiles]    = useState({})
  const [loading,     setLoading]     = useState(true)
  const [filter,      setFilter]      = useState('all')
  const [sortBy,      setSortBy]      = useState('recent')
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal,   setShowModal]   = useState(false)

  const fetchData = useCallback(async () => {
    const [songsRes, profilesRes] = await Promise.all([
      supabase
        .from('songs')
        .select('*, activity:song_activity(id,member_id,action,created_at), files:song_files(id,type)')
        .order('updated_at', { ascending: false }),
      supabase.from('profiles').select('*'),
    ])

    if (songsRes.data) {
      const sorted = songsRes.data.map(s => ({
        ...s,
        activity: [...(s.activity ?? [])].sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        ),
      }))
      setSongs(sorted)
    }

    if (profilesRes.data) {
      const map = {}
      profilesRes.data.forEach(p => { map[p.id] = p })
      setProfiles(map)
    }

    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const counts = useMemo(() => {
    const c = { all: songs.length }
    songs.forEach(s => { c[s.stage] = (c[s.stage] ?? 0) + 1 })
    return c
  }, [songs])

  const visible = useMemo(() => {
    let list = songs
    if (filter !== 'all') list = list.filter(s => s.stage === filter)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(s =>
        s.title.toLowerCase().includes(q) ||
        s.tags?.some(t => t.toLowerCase().includes(q)) ||
        s.notes?.toLowerCase().includes(q)
      )
    }
    return sortSongs(list, sortBy)
  }, [songs, filter, sortBy, searchQuery])

  async function handleCreate({ title, stage }) {
    const { data, error } = await supabase
      .from('songs')
      .insert({ title, stage, created_by: profile.id })
      .select('*, activity:song_activity(id,member_id,action,created_at), files:song_files(id,type)')
      .single()
    if (error) { console.error(error); return }

    await supabase.from('song_activity').insert({
      song_id: data.id, member_id: profile.id, action: 'created song',
    })

    setSongs(prev => [{ ...data, activity: [{ member_id: profile.id, action: 'created song', created_at: new Date().toISOString() }], files: [] }, ...prev])
  }

  return (
    <div className={styles.page}>
      <Header onSearch={setSearchQuery} onAddSong={() => setShowModal(true)}>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', borderRadius: '50%', padding: 0 }} onClick={signOut} title="Sign out">
          <Avatar profile={profile} size="md" />
        </button>
      </Header>

      <main className={styles.main}>
        <div className={styles.container}>
          {loading ? (
            <div className={styles.loading}>Loading songs…</div>
          ) : (
            <>
              <FilterBar
                activeFilter={filter}
                onFilter={setFilter}
                sortBy={sortBy}
                onSort={setSortBy}
                counts={counts}
              />
              <div className={styles.list}>
                {visible.length === 0 ? (
                  <div className={styles.empty}>
                    {songs.length === 0
                      ? <><p>No songs yet.</p><p className={styles.emptyHint}>Hit "New Song" to add your first one.</p></>
                      : <><p>No songs found.</p><p className={styles.emptyHint}>Try a different search or filter.</p></>
                    }
                  </div>
                ) : (
                  visible.map(song => <SongCard key={song.id} song={song} profiles={profiles} />)
                )}
              </div>
            </>
          )}
        </div>
      </main>

      {showModal && (
        <NewSongModal onClose={() => setShowModal(false)} onCreate={handleCreate} />
      )}
    </div>
  )
}
