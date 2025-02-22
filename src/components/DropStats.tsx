import { Drop, DropMetrics } from 'models/drop'
import { POAP_MOMENTS_URL } from 'models/poap'
import { formatStat } from 'utils/number'
import Stats from 'components/Stats'

function DropStats({
  drop,
  metrics,
}: {
  drop: Drop
  metrics: DropMetrics
}) {
  const stats: Record<string, {
    text: string
    title?: string
    href?: string
    external?: boolean
    small?: boolean
  }> = {}

  stats['collectors'] = metrics.emailReservations > 0
    ? { text: formatStat(metrics.mints + metrics.emailReservations) }
    : { text: formatStat(metrics.mints) }

  if (metrics.emailReservations > 0) {
    stats['mints'] = {
      text: formatStat(metrics.mints),
    }
    stats['reservations'] = {
      text: formatStat(metrics.emailReservations),
    }
  }

  if (
    metrics.emailClaims > 0 &&
    metrics.emailClaimsMinted > 0
  ) {
    stats['email conversion'] = {
      text: formatStat(metrics.emailClaimsMinted),
      title:
        `${Math.trunc(metrics.emailClaimsMinted * 100 / metrics.emailClaims)}%` +
        ` of ${metrics.emailClaims} email claims`,
    }
  }

  if (metrics.collectionsIncludes > 0) {
    stats['collections'] = {
      text: formatStat(metrics.collectionsIncludes),
    }
  }

  if (metrics.momentsUploaded > 0) {
    stats['moments'] = {
      text: formatStat(metrics.momentsUploaded),
      title: `View uploaded moments on ${drop.name}`,
      href: `${POAP_MOMENTS_URL}/drop/${drop.id}`,
      external: true,
    }
  }

  return (
    <Stats stats={stats} highlight="collectors" />
  )
}

export default DropStats
