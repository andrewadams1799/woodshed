export default function TimeAgo({ timestamp }) {
  const diff = Date.now() - timestamp
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  const weeks = Math.floor(diff / (7 * 86400000))

  if (mins < 1)   return <span>just now</span>
  if (mins < 60)  return <span>{mins}m ago</span>
  if (hours < 24) return <span>{hours}h ago</span>
  if (days < 7)   return <span>{days}d ago</span>
  return <span>{weeks}w ago</span>
}
