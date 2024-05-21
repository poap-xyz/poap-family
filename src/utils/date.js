import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import localizedFormat from 'dayjs/plugin/localizedFormat'

dayjs.extend(relativeTime)
dayjs.extend(localizedFormat)

/**
 * @param {Date | number | string} date
 */
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

/**
 * @param {Date | number | string} date
 */
export function formatMonthYear(date) {
  return dayjs(date).format('MMM \'YY')
}

/**
 * @param {Date | number | string} date
 */
export function parseEndOfDayDate(date) {
  return dayjs(date).endOf('day').toDate()
}
