/** @jsxImportSource https://esm.sh/react */
import axios from 'https://esm.sh/axios'
import { ImageResponse } from 'https://deno.land/x/og_edge/mod.ts'

const FAMILY_API_URL = 'https://api.poap.family'

function parseEventIds(rawIds) {
  let eventIds = rawIds.split(',')
    .filter((value, index, all) => all.indexOf(value) === index)
    .map((value) => parseInt(value.trim()))
    .filter((eventId) => !isNaN(eventId))
  eventIds.sort((a, b) => a - b)
  return eventIds
}

function getEventIds(requestUrl) {
  const url = new URL(requestUrl)
  const [, rawEventIds] = url.pathname.match(/images\/([^/]+)/)
  return parseEventIds(rawEventIds)
}

async function getEvents(eventIds) {
  const response = await axios.get(`${FAMILY_API_URL}/events/${eventIds.map((eventId) => encodeURIComponent(eventId)).join(',')}?fresh=true`)
  const events = response.data
  if (typeof events !== 'object') {
    throw new Error(`Events invalid response (type ${typeof events} expected object)`)
  }
  return events
}

function renderEventsImages(events, canvas, size, pos) {
  if (events.length === 0) {
    return []
  }

  const angle = 360 / events.length
  const offset = size / 2
  const radius = (canvas - size) / 2
  const center = pos + offset + radius

  const images = []

  events.forEach((event, i) => {
    const x = center + radius * Math.cos(angle * i * Math.PI / 180)
    const y = center + radius * Math.sin(angle * i * Math.PI / 180)

    images.push(
      <img
        src={`${event.image_url}?format=png&size=small`}
        alt={event.name}
        width={size}
        height={size}
        key={event.id}
        style={{
          display: 'flex',
          position: 'absolute',
          top: `${Math.round(y - offset)}px`,
          left: `${Math.round(x - offset)}px`,
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '50%',
        }}
      />
    )
  })

  return images
}

export default async function handler(request, context) {
  const eventIds = getEventIds(request.url)

  let eventMap
  try {
    eventMap = await getEvents(eventIds)
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

  const events = Object.values(eventMap)
    .map((event) => ({ event, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ event }) => event)

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
