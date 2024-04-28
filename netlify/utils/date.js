import dayjs from 'https://esm.sh/dayjs'
import localizedFormat from 'https://esm.sh/dayjs/plugin/localizedFormat'

dayjs.extend(localizedFormat)

export function formatDate(date) {
  return dayjs(date).format('ll')
}
