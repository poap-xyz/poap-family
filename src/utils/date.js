import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import localizedFormat from 'dayjs/plugin/localizedFormat'

dayjs.extend(relativeTime)
dayjs.extend(localizedFormat)

export function formatDate(date) {
  return dayjs(date).format('ll')
}

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

export function formatMonthYear(d) {
  return dayjs(d).format('MMM \'YY')
}
