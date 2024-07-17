import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import localizedFormat from 'dayjs/plugin/localizedFormat'

dayjs.extend(relativeTime)
dayjs.extend(localizedFormat)

export function formatDate(date: Date | number | string): string {
  return dayjs(date).format('ll')
}

/**
 * Relative time for timestamp in the past.
 */
export function formatDateAgo(ts: Date | number): string {
  if (typeof ts === 'number') {
    ts = new Date(ts * 1000)
  }
  return dayjs(ts).fromNow()
}

/**
 * Relative time in {secs} seconds in the future.
 */
export function secondsInTheFuture(secs: number): string {
  const ts = Date.now() + (secs * 1000)
  return dayjs(ts).fromNow()
}

export function formatMonthYear(date: Date | number | string): string {
  return dayjs(date).format('MMM \'YY')
}

export function parseEndOfDayDate(date: Date | number | string): Date {
  return dayjs(date).endOf('day').toDate()
}
