import { parseDropIds, Drop, DropData } from 'models/drop'
import { HttpError } from 'models/error'
import { fetchDrop, fetchDropMetrics, fetchDropsOrErrors } from 'services/drops'
import { fetchDropsCollectors } from 'services/collectors'

export async function eventLoader({ params }): Promise<DropData> {
  const dropId = parseInt(String(params.eventId))

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
    fetchDropsCollectors([dropId]),
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

export async function eventsLoader({ params }): Promise<Record<number, Drop>> {
  const dropIds = parseDropIds(params.eventIds)

  if (dropIds.length === 0) {
    throw new Response('', {
      status: 404,
      statusText: 'Drops not found',
    })
  }

  if (params.eventIds !== dropIds.join(',')) {
    throw new Response('', {
      status: 301,
      statusText: 'Drops given unordered',
      headers: {
        location: `/events/${dropIds.join(',')}`,
      },
    })
  }

  if (dropIds.length === 1) {
    throw new Response('', {
      status: 301,
      statusText: 'One drop',
      headers: {
        location: `/event/${dropIds[0]}`,
      },
    })
  }

  const [drops, errors] = await fetchDropsOrErrors(
    dropIds,
    /*includeDescription*/false
  )

  if (Object.keys(errors).length > 0) {
    const errorsByDropId = Object.assign({}, errors)
    const dropsNotFound = await Promise.allSettled(
      Object.entries(errors)
        .filter(
          ([, error]) => error instanceof HttpError && error.status === 404
        )
        .map(([rawDropId]) =>
          fetchDrop(parseInt(rawDropId), /*includeDescription*/false)
        )
    )

    for (const dropResult of dropsNotFound) {
      if (dropResult.status === 'rejected') {
        continue
      }

      const drop = dropResult.value

      if (!drop) {
        continue
      }

      drops[drop.id] = drop

      if (drop.id in errors) {
        delete errorsByDropId[drop.id]
      }
    }

    if (Object.keys(errorsByDropId).length > 0) {
      const response = JSON.stringify({
        errorsByEventId: Object.fromEntries(
          Object.entries(errorsByDropId).map(
            ([rawDropId, error]) => ([
              rawDropId,
              {
                message: error.message,
                status: error instanceof HttpError ? error.status : undefined,
              },
            ])
          )
        ),
      })

      throw new Response(response, {
        status: 503,
        statusText: 'Missing drops',
        headers: {
          'content-type': 'application/json',
        },
      })
    }
  }

  return drops
}
