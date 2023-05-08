import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

export function formatDateAgo(ts) {
  if (typeof ts === 'number') {
    ts = new Date(ts * 1000)
  }
  return dayjs(ts).fromNow()
}

export function secondsInTheFuture(secs) {
  const ts = Date.now() + (secs * 1000)
  return dayjs(ts).fromNow()
}
