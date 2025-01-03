import { Drop, DropMetrics } from 'models/drop'
import { POAP_MOMENTS_URL } from 'models/poap'
import { formatStat } from 'utils/number'
import Stats from 'components/Stats'

function DropStats({
  drop,
  collectors,
  metrics,
}: {
  drop: Drop
  collectors?: number
  metrics?: DropMetrics
}) {
  const stats: Record<string, {
    text: string
    title?: string
    href?: string
    external?: boolean
    small?: boolean
  }> = {}

  if (collectors) {
    stats['collectors'] = metrics && metrics.emailReservations > 0
      ? { text: formatStat(collectors + metrics.emailReservations) }
      : { text: formatStat(collectors) }
  } else {
    stats['collectors'] = metrics && metrics.emailReservations > 0
      ? { text: formatStat(0) }
      : { text: formatStat(metrics.emailReservations) }
  }

  if (metrics && metrics.emailReservations > 0) {
    stats['mints'] = {
      text: formatStat(collectors),
    }
    stats['reservations'] = {
      text: formatStat(metrics.emailReservations),
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
