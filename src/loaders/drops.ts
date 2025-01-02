import { DropData } from 'models/drop'
import { fetchDrop, fetchDropMetrics } from 'services/drops'
import { fetchDropsCollectors } from 'services/collectors'

interface DropParams {
  dropId?: string
}

export async function dropLoader({
  params,
}: {
  params: DropParams
}): Promise<DropData> {
  const dropId = parseInt(String(params.dropId))

  if (isNaN(dropId)) {
    throw new Response('', {
      status: 400,
      statusText: 'Invalid drop id',
    })
  }

  const drop = await fetchDrop(dropId, /*includeDescription*/true)

  if (!drop) {
    throw new Response('', {
      status: 404,
      statusText: 'Drop not found',
    })
  }

  const [collectorsSettled, metricsSettled] = await Promise.allSettled([
    fetchDropsCollectors([dropId], /*abortSignal*/undefined),
    fetchDropMetrics(dropId, /*abortSignal*/undefined),
  ])

  if (collectorsSettled.status === 'rejected') {
    throw new Response('', {
      status: 503,
      statusText:
        `Drop collectors could not be fetched: ${collectorsSettled.reason}`,
    })
  }

  const collectors = collectorsSettled.value
  const metrics = metricsSettled.status === 'fulfilled'
    ? metricsSettled.value
    : null

  return {
    drop,
    collectors,
    metrics,
  }
}
