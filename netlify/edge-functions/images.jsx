/** @jsxImportSource https://esm.sh/react */
import { ImageResponse } from 'https://deno.land/x/og_edge/mod.ts'
import { getEnv } from '../loaders/env.js'
import { getEvents } from '../loaders/api.js'
import { parseEventIds, sortEvents } from '../utils/event.js'
import { renderEventsImages } from '../utils/image.js'

function parseRequestUrl(requestUrl) {
  const url = new URL(requestUrl)
  const [, rawEventId] = url.pathname.match(/images\/([^/]+)/)
  const searchParams = url.searchParams.toString()
  return [rawEventId, searchParams ? `?${searchParams}` : '']
}

export default async function handler(request, context) {
  const [rawEventIds] = parseRequestUrl(request.url)
  const eventIds = parseEventIds(rawEventIds)
  const env = getEnv(context)

  let eventMap
  try {
    eventMap = await getEvents(eventIds, env)
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

  const events = sortEvents(eventMap)

  if (events.length === 1) {
    return new ImageResponse(
      (
        <img
          src={`${events[0].image_url}?format=png&size=large`}
          alt={events[0].name}
          width={512}
          height={512}
          style={{
            width: '512px',
            height: '512px',
            borderRadius: '50%',
          }}
        />
      ),
      {
        width: 512,
        height: 512,
      }
    )
  }

  let images = []
  if (events.length < 6) {
    images = [
      ...renderEventsImages(events, 512, 224, 0),
    ]
  } else if (events.length <= 8) {
    images = [
      ...renderEventsImages(events, 512, 192, 0),
    ]
  } else if (events.length < 12) {
    images = [
      ...renderEventsImages(events, 512, 160, 0),
    ]
  } else {
    images = [
      ...renderEventsImages(events.splice(0, 12), 512, 128, 0),
      ...renderEventsImages(events.splice(0, 12), 256, 64, 128),
      ...renderEventsImages(events.splice(0, 12), 128, 32, 192),
    ]
  }

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          position: 'relative',
          width: '512px',
          height: '512px',
          borderRadius: '50%',
        }}
      >
        {images}
      </div>
    ),
    {
      width: 512,
      height: 512,
    }
  )
}

export const config = {
  path: '/images/*',
}
