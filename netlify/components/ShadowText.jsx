import React from 'https://esm.sh/react'

export function ShadowText({ text, small }) {
  return (
    <div
      style={{
        display: 'flex',
        margin: '0 auto',
      }}
    >
      <div
        style={{
          display: 'flex',
          position: 'relative',
          marginTop: '-5px',
          whiteSpace: 'nowrap',
          fontFamily: 'Rubik-Black',
          fontWeight: 900,
          fontStyle: 'normal',
          fontSize: small ? '56px' : '84px',
          letterSpacing: small ? '-4px' : '-6px',
        }}
      >
        <div
          style={{
            position: 'absolute',
            color: '#473e6b',
            transform: small ? 'translate(-2px, 4px)' : 'translate(-4px, 6px)',
          }}
        >{text}</div>
        <div
          style={{
            position: 'relative',
            stroke: '#5e58a5',
            color: '#eac9f8',
            strokeWidth: small ? '4px' : '8px',
          }}
        >{text}</div>
      </div>
    </div>
  )
}
