import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import localizedFormat from 'dayjs/plugin/localizedFormat'

dayjs.extend(relativeTime)
dayjs.extend(localizedFormat)

export function formatDate(date) {
  return dayjs(date).format('ll')
}

/**
 * Relative time for timestamp in the past.
 *
 * @param {Date | number} ts
 */
export function formatDateAgo(ts) {
  if (typeof ts === 'number') {
    ts = new Date(ts * 1000)
  }
  return dayjs(ts).fromNow()
}

/**
 * Relative time in {secs} seconds in the future.
 *
 * @param {number} secs
 */
export function secondsInTheFuture(secs) {
  const ts = Date.now() + (secs * 1000)
  return dayjs(ts).fromNow()
}

export function formatMonthYear(d) {
  return dayjs(d).format('MMM \'YY')
}

export function parseEndOfDayDate(date) {
  return dayjs(date).endOf('day').toDate()
}
