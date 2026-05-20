import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import styles from './SongPage.module.css'
import StageBadge from '../components/StageBadge'
import Avatar from '../components/Avatar'
import TimeAgo from '../components/TimeAgo'
import { STAGES, FILE_TYPES, formatBytes, getFileType } from '../data/mockData'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const TABS = ['Overview', 'Lyrics', 'Files', 'Activity']

export default function SongPage() {
  const { id }      = useParams()
  const navigate    = useNavigate()
  const { profile } = useAuth()

  const [song,      setSong]      = useState(null)
  const [files,     setFiles]     = useState([])
  const [activity,  setActivity]  = useState([])
  const [profiles,  setProfiles]  = useState({})
  const [loading,   setLoading]   = useState(true)
  const [tab,       setTab]       = useState('Overview')
  const [stageOpen, setStageOpen] = useState(false)

  useEffect(() => { fetchAll() }, [id])

  async function fetchAll() {
    const [songRes, filesRes, activityRes, profilesRes] = await Promise.all([
      supabase.from('songs').select('*').eq('id', id).single(),
      supabase.from('song_files').select('*').eq('song_id', id).order('added_at', { ascending: false }),
      supabase.from('song_activity').select('*').eq('song_id', id).order('created_at', { ascending: false }),
      supabase.from('profiles').select('*'),
    ])
    if (songRes.data) setSong(songRes.data)
    if (filesRes.data) setFiles(filesRes.data)
    if (activityRes.data) setActivity(activityRes.data)
    if (profilesRes.data) {
      const map = {}
      profilesRes.data.forEach(p => { map[p.id] = p })
      setProfiles(map)
    }
    setLoading(false)
  }

  async function logActivity(action) {
    const { data } = await supabase
      .from('song_activity')
      .insert({ song_id: id, member_id: profile.id, action })
      .select()
      .single()
    if (data) setActivity(prev => [data, ...prev])
  }

  async function updateSong(patch) {
    const { data, error } = await supabase
      .from('songs')
      .update(patch)
      .eq('id', id)
      .select()
      .single()
    if (!error && data) setSong(data)
    return { error }
  }

  async function changeStage(newStage) {
    setStageOpen(false)
    if (newStage === song.stage) return
    await updateSong({ stage: newStage })
    await logActivity(`changed stage to ${STAGES.find(s => s.id === newStage)?.label}`)
  }

  if (loading) {
    return <div className={styles.loading}>Loading…</div>
  }

  if (!song) {
    return (
      <div className={styles.notFound}>
        <p>Song not found.</p>
        <button onClick={() => navigate('/')}>← Back to songs</button>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      {/* Top bar */}
      <div className={styles.topbar}>
        <div className={styles.topbarInner}>
          <button className={styles.backBtn} onClick={() => navigate('/')}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            All Songs
          </button>

          <div className={styles.titleArea}>
            <h1 className={styles.title}>{song.title}</h1>
            <div style={{ position: 'relative' }}>
              <button className={styles.stageBtn} onClick={() => setStageOpen(v => !v)}>
                <StageBadge stage={song.stage} size="md" />
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ marginLeft: 4 }}>
                  <path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {stageOpen && (
                <div className={styles.stageDropdown}>
                  {STAGES.map(s => (
                    <button
                      key={s.id}
                      className={`${styles.stageOption} ${song.stage === s.id ? styles.stageOptionActive : ''}`}
                      onClick={() => changeStage(s.id)}
                    >
                      <StageBadge stage={s.id} size="sm" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className={styles.tabBar}>
        <div className={styles.tabBarInner}>
          {TABS.map(t => (
            <button
              key={t}
              className={`${styles.tab} ${tab === t ? styles.tabActive : ''}`}
              onClick={() => setTab(t)}
            >
              {t}
              {t === 'Files' && files.length > 0 && (
                <span className={styles.tabCount}>{files.length}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <main className={styles.main}>
        <div className={styles.container}>
          {tab === 'Overview' && (
            <OverviewTab
              song={song}
              profiles={profiles}
              onSave={async (patch, actionLabel) => {
                await updateSong(patch)
                await logActivity(actionLabel)
              }}
            />
          )}
          {tab === 'Lyrics' && (
            <LyricsTab
              song={song}
              onSave={async (lyrics) => {
                await updateSong({ lyrics })
                await logActivity('updated lyrics')
              }}
            />
          )}
          {tab === 'Files' && (
            <FilesTab
              songId={id}
              files={files}
              profiles={profiles}
              profile={profile}
              onUpload={(file) => setFiles(prev => [file, ...prev])}
              onDelete={(fileId) => setFiles(prev => prev.filter(f => f.id !== fileId))}
              logActivity={logActivity}
            />
          )}
          {tab === 'Activity' && (
            <ActivityTab activity={activity} profiles={profiles} />
          )}
        </div>
      </main>
    </div>
  )
}

// ── Overview ─────────────────────────────────────────────────

function OverviewTab({ song, profiles, onSave }) {
  const [editingNotes, setEditingNotes] = useState(false)
  const [notesVal,     setNotesVal]     = useState(song.notes ?? '')
  const [savingNotes,  setSavingNotes]  = useState(false)
  const [newTag,       setNewTag]       = useState('')
  const [tags,         setTags]         = useState(song.tags ?? [])

  async function saveNotes() {
    setSavingNotes(true)
    await onSave({ notes: notesVal }, 'updated notes')
    setSavingNotes(false)
    setEditingNotes(false)
  }

  async function addTag(e) {
    e.preventDefault()
    const tag = newTag.trim().toLowerCase()
    if (!tag || tags.includes(tag)) { setNewTag(''); return }
    const next = [...tags, tag]
    setTags(next)
    setNewTag('')
    await onSave({ tags: next }, `added tag "${tag}"`)
  }

  async function removeTag(tag) {
    const next = tags.filter(t => t !== tag)
    setTags(next)
    await onSave({ tags: next }, `removed tag "${tag}"`)
  }

  const creator = profiles[song.created_by]

  return (
    <div className={styles.overviewGrid}>
      <div className={styles.overviewMain}>
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Notes</h3>
            {!editingNotes && (
              <button className={styles.editLink} onClick={() => setEditingNotes(true)}>Edit</button>
            )}
          </div>
          {editingNotes ? (
            <div className={styles.editBlock}>
              <textarea
                autoFocus
                className={styles.textarea}
                value={notesVal}
                onChange={e => setNotesVal(e.target.value)}
                rows={5}
                placeholder="Add notes about this song…"
              />
              <div className={styles.editActions}>
                <button className={styles.cancelBtn} onClick={() => { setNotesVal(song.notes ?? ''); setEditingNotes(false) }}>Cancel</button>
                <button className={styles.saveBtn} onClick={saveNotes} disabled={savingNotes}>
                  {savingNotes ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          ) : (
            notesVal
              ? <p className={styles.notes}>{notesVal}</p>
              : <p className={styles.placeholder} onClick={() => setEditingNotes(true)}>Click to add notes…</p>
          )}
        </section>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Tags</h3>
          <div className={styles.tags}>
            {tags.map(t => (
              <button key={t} className={styles.tag} onClick={() => removeTag(t)} title="Remove tag">
                {t} ×
              </button>
            ))}
            <form onSubmit={addTag} className={styles.tagForm}>
              <input
                type="text"
                value={newTag}
                onChange={e => setNewTag(e.target.value)}
                placeholder="Add tag…"
                className={styles.tagInput}
                maxLength={30}
              />
            </form>
          </div>
        </section>
      </div>

      <div className={styles.overviewSide}>
        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Details</h3>
          <div className={styles.detailList}>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Created by</span>
              <span className={styles.detailVal}>
                <Avatar profile={creator} size="sm" />
                <span>{creator?.name ?? '—'}</span>
              </span>
            </div>
            {song.key && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Key</span>
                <span className={styles.detailVal}>{song.key}</span>
              </div>
            )}
            {song.bpm && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>BPM</span>
                <span className={styles.detailVal}>{song.bpm}</span>
              </div>
            )}
          </div>
        </section>

        <section className={styles.section}>
          <h3 className={styles.sectionTitle}>Stage Progress</h3>
          <div className={styles.stageTrack}>
            {STAGES.map((s, i) => {
              const current = STAGES.findIndex(st => st.id === song.stage)
              const done    = i <= current
              return (
                <div key={s.id} className={styles.stageStep}>
                  <div className={`${styles.stageDot} ${done ? styles.stageDotDone : ''}`} />
                  <span className={`${styles.stageStepLabel} ${i === current ? styles.stageStepCurrent : ''}`}>
                    {s.label}
                  </span>
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}

// ── Lyrics ────────────────────────────────────────────────────

function LyricsTab({ song, onSave }) {
  const [editing, setEditing] = useState(false)
  const [value,   setValue]   = useState(song.lyrics ?? '')
  const [saving,  setSaving]  = useState(false)

  async function save() {
    setSaving(true)
    await onSave(value)
    setSaving(false)
    setEditing(false)
  }

  return (
    <div className={styles.lyricsWrap}>
      {editing ? (
        <>
          <textarea
            autoFocus
            className={styles.lyricsTextarea}
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder="Write your lyrics here…&#10;&#10;[Verse 1]&#10;…"
          />
          <div className={styles.editActions}>
            <button className={styles.cancelBtn} onClick={() => { setValue(song.lyrics ?? ''); setEditing(false) }}>Cancel</button>
            <button className={styles.saveBtn} onClick={save} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </>
      ) : (
        <>
          <div className={styles.lyricsToolbar}>
            <button className={styles.editLink} onClick={() => setEditing(true)}>Edit lyrics</button>
          </div>
          {value
            ? <pre className={styles.lyrics}>{value}</pre>
            : <div className={styles.lyricsEmpty}>
                <p>No lyrics yet.</p>
                <button className={styles.editLink} onClick={() => setEditing(true)}>Add lyrics</button>
              </div>
          }
        </>
      )}
    </div>
  )
}

// ── Files ─────────────────────────────────────────────────────

function FilesTab({ songId, files, profiles, profile, onUpload, onDelete, logActivity }) {
  const inputRef   = useRef()
  const [uploading, setUploading] = useState(false)
  const [error,     setError]     = useState('')

  async function handleFiles(fileList) {
    setError('')
    setUploading(true)
    for (const file of fileList) {
      const path = `${songId}/${Date.now()}-${file.name}`
      const { error: uploadErr } = await supabase.storage
        .from('song-files')
        .upload(path, file)
      if (uploadErr) { setError(uploadErr.message); continue }

      const { data, error: dbErr } = await supabase
        .from('song_files')
        .insert({
          song_id:      songId,
          name:         file.name,
          type:         getFileType(file),
          size_bytes:   file.size,
          storage_path: path,
          added_by:     profile.id,
        })
        .select()
        .single()
      if (!dbErr && data) {
        onUpload(data)
        await logActivity(`uploaded ${file.name}`)
      }
    }
    setUploading(false)
  }

  function handleInputChange(e) {
    handleFiles([...e.target.files])
  }

  function handleDrop(e) {
    e.preventDefault()
    handleFiles([...e.dataTransfer.files])
  }

  async function handleDelete(file) {
    await supabase.storage.from('song-files').remove([file.storage_path])
    await supabase.from('song_files').delete().eq('id', file.id)
    onDelete(file.id)
    await logActivity(`deleted ${file.name}`)
  }

  return (
    <div className={styles.filesWrap}>
      <div
        className={styles.uploadZone}
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          style={{ display: 'none' }}
          onChange={handleInputChange}
        />
        {uploading ? (
          <p>Uploading…</p>
        ) : (
          <>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <p>Drop files here or <span className={styles.uploadLink}>browse</span></p>
            <p className={styles.uploadHint}>Audio, lyrics, images, MIDI — anything goes</p>
          </>
        )}
      </div>

      {error && <p className={styles.uploadError}>{error}</p>}

      {files.length > 0 && (
        <div className={styles.fileList}>
          {files.map(f => {
            const adder  = profiles[f.added_by]
            const config = FILE_TYPES[f.type] ?? { icon: '📎', label: 'File' }
            return (
              <div key={f.id} className={styles.fileRow}>
                <span className={styles.fileIcon}>{config.icon}</span>
                <div className={styles.fileInfo}>
                  <span className={styles.fileName}>{f.name}</span>
                  <span className={styles.fileMeta}>
                    {formatBytes(f.size_bytes)} · {adder?.name ?? '?'} · <TimeAgo timestamp={new Date(f.added_at).getTime()} />
                  </span>
                </div>
                {f.added_by === profile?.id && (
                  <button
                    className={styles.fileDelete}
                    onClick={() => handleDelete(f)}
                    title="Delete file"
                  >
                    <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                      <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Activity ──────────────────────────────────────────────────

function ActivityTab({ activity, profiles }) {
  return (
    <div className={styles.activityWrap}>
      {activity.length === 0 && (
        <p className={styles.placeholder} style={{ padding: '24px 20px' }}>No activity yet.</p>
      )}
      {activity.map(a => {
        const member = profiles[a.member_id]
        return (
          <div key={a.id} className={styles.activityRow}>
            <Avatar profile={member} size="md" />
            <div className={styles.activityBody}>
              <span className={styles.activityMember}>{member?.name ?? 'Someone'}</span>
              {' '}
              <span className={styles.activityAction}>{a.action}</span>
            </div>
            <span className={styles.activityTime}>
              <TimeAgo timestamp={new Date(a.created_at).getTime()} />
            </span>
          </div>
        )
      })}
    </div>
  )
}
