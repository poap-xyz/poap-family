import React from 'https://esm.sh/react'
import { formatDate } from '../utils/date.js'
import { encodeLocation } from '../utils/event.js'

export function EventHeader({ event }) {
  const eventLocation = encodeLocation(event)
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        margin: '0 8px 0',
      }}
    >
      <div
        style={{
          display: 'flex',
          fontFamily: 'Rubik-Black',
          fontWeight: 900,
          fontStyle: 'normal',
          fontSize: '44px',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis',
        }}
      >
        {event.name}
      </div>
      <div
        style={{
          display: 'flex',
          gap: '15px',
          marginTop: '-5px',
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize: '28px',
          }}
        >
          {formatDate(event.start_date)}
        </div>
        {eventLocation && (
          <div
            style={{
              display: 'flex',
              fontSize: '38px',
              lineHeight: 0.8,
            }}
          >
            ·
          </div>
        )}
        {eventLocation && (
          <div
            style={{
              display: 'flex',
              fontSize: '28px',
            }}
          >
            {eventLocation}
          </div>
        )}
      </div>
    </div>
  )
}
