import { Drop, DropMetrics } from 'models/drop'
import { POAP_MOMENTS_URL } from 'models/poap'
import { formatStat } from 'utils/number'
import { formatDateAgo } from 'utils/date'
import Stats from 'components/Stats'

function EventStats({
  event,
  collectors,
  cachedTs,
  metrics,
}: {
  event: Drop
  collectors: number
  cachedTs?: number
  metrics?: DropMetrics
}) {
  const stats = {
    'collectors': metrics && metrics.emailReservations > 0
      ? {
          text: formatStat(collectors + metrics.emailReservations),
        }
      : {
          text: formatStat(collectors),
          title: cachedTs != null ? `Cached ${formatDateAgo(cachedTs)}` : undefined,
        },
  }

  if (metrics && metrics.emailReservations > 0) {
    stats['mints'] = {
      text: formatStat(collectors),
      title: cachedTs != null ? `Cached ${formatDateAgo(cachedTs)}` : undefined,
    }
    stats['reservations'] = {
      text: formatStat(metrics.emailReservations),
      title: metrics.ts ? `Cached ${formatDateAgo(metrics.ts)}` : undefined,
    }
  }

  if (metrics && metrics.emailClaims > 0 && metrics.emailClaimsMinted > 0) {
    stats['email conversion'] = {
      text: formatStat(metrics.emailClaimsMinted),
      title: `${Math.trunc(metrics.emailClaimsMinted * 100 / metrics.emailClaims)}% of ${metrics.emailClaims} email claims`,
    }
  }

  if (metrics && metrics.collectionsIncludes > 0) {
    stats['collections'] = {
      text: formatStat(metrics.collectionsIncludes),
    }
  }

  if (metrics && metrics.momentsUploaded > 0) {
    stats['moments'] = {
      text: formatStat(metrics.momentsUploaded),
      title: `View uploaded moments on ${event.name}`,
      href: `${POAP_MOMENTS_URL}/drop/${event.id}`,
      external: true,
    }
  }

  return (
    <Stats stats={stats} highlight="collectors" />
  )
}

export default EventStats
