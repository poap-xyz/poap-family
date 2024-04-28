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
      }}
    >
      <div
        style={{
          display: 'flex',
          fontFamily: 'Rubik-Black',
          fontWeight: 900,
          fontStyle: 'normal',
          fontSize: '22px',
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
          fontSize: '14px',
          marginTop: '-5px',
        }}
      >
        {formatDate(event.start_date)}
      </div>
      {eventLocation && (
        <div
          style={{
            display: 'flex',
            fontSize: '14px',
          }}
        >
          {eventLocation}
        </div>
      )}
    </div>
  )
}