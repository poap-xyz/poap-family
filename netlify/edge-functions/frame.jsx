/** @jsxImportSource https://esm.sh/react */
import { ImageResponse } from 'https://deno.land/x/og_edge/mod.ts'
import { getEnv } from '../loaders/env.js'
import { getEventsInfo } from '../loaders/api.js'
import { parseEventIds, sortEvents } from '../utils/event.js'
import { renderEventsImages } from '../utils/image.js'
import { EventHeader } from '../components/EventHeader.jsx'
import { Stats } from '../components/Stats.jsx'

function parseRequestUrl(requestUrl) {
  const url = new URL(requestUrl)
  const [, rawEventId] = url.pathname.match(/frame\/([^/]+)/)
  const searchParams = url.searchParams.toString()
  return [rawEventId, searchParams ? `?${searchParams}` : '']
}

export default async function handler(request, context) {
  const [rawEventIds] = parseRequestUrl(request.url)
  const eventIds = parseEventIds(rawEventIds)
  const env = getEnv(context)

  let eventMap
  try {
    eventMap = await getEventsInfo(eventIds, env)
  } catch (err) {
    if (err?.response?.status === 404) {
      return new Response(null, {
        status: 404,
      })
    }
    return new Response(null, {
      status: 503,
    })
  }

  const eventsInfo = sortEvents(eventMap)
  const images = []

  let totalSupply = 0
  let totalReservations = 0
  let totalMoments = 0
  let totalCollections = 0

  for (const eventInfo of eventsInfo) {
    totalSupply += eventInfo.owners.length
    totalReservations += eventInfo.metrics?.emailReservations ?? 0
    totalMoments += eventInfo.metrics?.momentsUploaded ?? 0
    totalCollections += eventInfo.metrics?.collectionsIncludes ?? 0
  }

  if (eventsInfo.length === 1) {
    images.push(
      <img
        src={`${eventsInfo[0].event.image_url}?format=png&size=large`}
        alt={eventsInfo[0].event.name}
        width={512}
        height={512}
        style={{
          display: 'flex',
          position: 'absolute',
          top: '0',
          left: '233px',
          width: '512px',
          height: '512px',
          borderRadius: '50%',
        }}
      />
    )
  } else if (eventsInfo.length < 6) {
    images.push(
      ...renderEventsImages(eventsInfo.map((eventInfo) => eventInfo.event), 512, 224, [233, 0])
    )
  } else {
    images.push(
      ...renderEventsImages(eventsInfo.slice(0, 8).map((eventInfo) => eventInfo.event), 512, 192, [233, 0])
    )
  }

  const [Rubik, RubikBlack] = await Promise.all([
    fetch(`${env.FAMILY_URL}/fonts/Rubik-Regular.ttf`).then((res) => res.arrayBuffer()),
    fetch(`${env.FAMILY_URL}/fonts/Rubik-Black.ttf`).then((res) => res.arrayBuffer()),
  ])

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          position: 'relative',
          width: '978px',
          height: '512px',
        }}
      >
        <div
          style={{
            display: 'flex',
            position: 'absolute',
            top: '0',
            left: '0',
            width: '978px',
            height: '512px',
            borderRadius: '50%',
          }}
        >
          {images}
        </div>
        <div
          style={{
            display: 'flex',
            position: 'absolute',
            top: '0',
            left: '0',
            width: '978px',
            height: '512px',
            background: 'linear-gradient(180deg, transparent, rgba(255, 255, 255, 0.9) 80%)',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              position: 'relative',
              left: '0',
              top: '0',
              width: '978px',
              height: '512px',
            }}
          >
            {eventsInfo.length === 1 && EventHeader({ event: eventsInfo[0].event })}
            <div
              style={{
                display: 'flex',
                flexShrink: '1',
                margin: eventsInfo.length === 1 ? '0' : '0 auto',
              }}
            >
              {Stats({
                supply: totalSupply,
                reservations: totalReservations,
                moments: totalMoments,
                collections: totalCollections,
              })}
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 978,
      height: 512,
      fonts: [
        {
          name: 'Rubik',
          data: Rubik,
          weight: 500,
          style: 'normal',
        },
        {
          name: 'Rubik-Black',
          data: RubikBlack,
          weight: 900,
          style: 'normal',
        },
      ],
    }
  )
}

export const config = {
  path: '/frame/*',
}
