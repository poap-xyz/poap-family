import React from 'https://esm.sh/react'
import { ShadowText } from './ShadowText.jsx'

export function Stats({ supply, reservations, moments, collections }) {
  const total = supply + reservations

  const highlighted = {
    text: String(total),
    title: `collector${total === 1 ? '' : 's'}`,
  }

  const stats = []

  if (total !== supply) {
    stats.push({
      text: String(supply),
      title: `mint${supply === 1 ? '' : 's'}`,
    })
    stats.push({
      text: String(reservations),
      title: `reservation${reservations === 1 ? '' : 's'}`,
    })
  }

  if (moments && moments > 0) {
    stats.push({
      text: String(moments),
      title: `moment${moments === 1 ? '' : 's'}`,
    })
  }

  if (collections && collections > 0) {
    stats.push({
      text: String(collections),
      title: `collection${collections === 1 ? '' : 's'}`,
    })
  }

  return (
    <div
      style={{
        display: 'flex',
        border: '4px solid #efeeff',
        borderRadius: '16px',
        margin: '4px 8px 8px 8px',
      }}
    >
      <div
        style={{
          display: 'flex',
          margin: '-4px',
        }}
      >
        <div
          style={{
            display: 'flex',
            padding: '4px 5px 0 5px',
            backgroundColor: '#efeeff',
            border: '4px solid #efeeff',
            borderRadius: '16px',
            alignSelf: 'center',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              textAlign: 'center',
              minWidth: '60px',
              gap: '1px',
            }}
          >
            {ShadowText({ text: highlighted.text, small: false })}
            <div
              style={{
                margin: '0 auto',
                backgroundColor: 'white',
                padding: '1px 3px',
                borderRadius: '7px',
                whiteSpace: 'nowrap',
                color: 'black',
                fontFamily: 'Rubik',
                fontSize: '16px',
                fontWeight: 500,
                fontStyle: 'normal',
              }}
            >
              {highlighted.title}
            </div>
          </div>
        </div>
        {stats.map((stat) => (
          <div
            style={{
              display: 'flex',
              marginTop: '8px',
              padding: '4px 0',
              border: '4px solid transparent',
              borderRadius: '16px',
              alignSelf: 'center',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                textAlign: 'center',
                minWidth: '60px',
                gap: '1px',
              }}
            >
              {ShadowText({ text: stat.text, small: true })}
              <div
                style={{
                  margin: '0 auto',
                  backgroundColor: 'white',
                  padding: '1px 3px',
                  borderRadius: '7px',
                  whiteSpace: 'nowrap',
                  color: 'black',
                  fontFamily: 'Rubik',
                  fontSize: '14px',
                  fontWeight: 500,
                  fontStyle: 'normal',
                }}
              >
                {stat.title}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
