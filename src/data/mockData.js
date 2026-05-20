export const STAGES = [
  { id: 'idea',     label: 'Idea',     order: 0 },
  { id: 'lyrics',   label: 'Lyrics',   order: 1 },
  { id: 'demo',     label: 'Demo',     order: 2 },
  { id: 'produced', label: 'Produced', order: 3 },
  { id: 'done',     label: 'Done',     order: 4 },
]

export const FILE_TYPES = {
  audio: { icon: '🎵', label: 'Audio' },
  lyric: { icon: '📝', label: 'Lyrics' },
  image: { icon: '🖼️', label: 'Image' },
  video: { icon: '🎬', label: 'Video' },
  doc:   { icon: '📄', label: 'Doc'   },
  midi:  { icon: '🎹', label: 'MIDI'  },
}

export function formatBytes(bytes) {
  if (bytes < 1024)             return `${bytes} B`
  if (bytes < 1024 * 1024)      return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 ** 3)        return `${(bytes / 1024 ** 2).toFixed(1)} MB`
  return `${(bytes / 1024 ** 3).toFixed(1)} GB`
}

export function getFileType(file) {
  const mime = file.type
  const name = file.name.toLowerCase()
  if (mime.startsWith('audio/') || /\.(mp3|wav|m4a|flac|aiff|ogg|aac)$/.test(name)) return 'audio'
  if (mime.startsWith('image/'))                                                        return 'image'
  if (mime.startsWith('video/'))                                                        return 'video'
  if (/\.midi?$/.test(name))                                                            return 'midi'
  if (/\.(txt|doc|docx|pdf|rtf)$/.test(name))                                          return 'lyric'
  return 'doc'
}

export function initials(name = '') {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'
}
