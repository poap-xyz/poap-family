import { Fragment, ReactNode, useState } from 'react'
import { clsx } from 'clsx'
import { FastArrowLeft, FastArrowRight } from 'iconoir-react'
import { Drop } from 'models/drop'
import { formatDate } from 'utils/date'
import linkify from 'utils/linkify'
import Ilustration from 'assets/images/Illustration_Cities_BuenosAires.png'
import Card from 'components/Card'
import TokenImageZoom from 'components/TokenImageZoom'
import ExternalLink from 'components/ExternalLink'
import 'styles/event-info.css'

function EventInfo({
  event,
  children,
}: {
  event: Drop
  children?: ReactNode
}) {
  const [extraOpen, setExtraOpen] = useState<boolean>(false)

  return (
    <div className="event-info-header">
      {event.description && (
        <div className={clsx('event-info-extra', extraOpen ? 'open' : 'close')}>
          <div className="event-info-extra-card">
            {extraOpen && (
              <div className="event-info-extra-content">
                {event.description.split('\n').map(
                  (p, i) => (
                    <p key={`p${i}`}>
                      {linkify(p, ExternalLink).map(
                        (t, e) => <Fragment key={`t${e}`}>{t}</Fragment>
                      )}
                    </p>
                  )
                )}
              </div>
            )}
            <button
              onClick={() => setExtraOpen((prev) => !prev)}
              className="event-info-extra-button"
            >
              {extraOpen ? <FastArrowLeft /> : <FastArrowRight />}
            </button>
          </div>
        </div>
      )}
      <Card
        ilustration={{
          url: Ilustration,
          pos: '-3rem -8rem',
        }}
      >
        <div className="event-info">
          <div className="event-image">
            <TokenImageZoom event={event} zoomSize={512} size={128} />
          </div>
          <div className="event-data">
            <h1>{event.name}</h1>
            <div className="event-date">{formatDate(event.start_date)}</div>
            {event.city && event.country && (
              <div className="place">{event.city}, {event.country}</div>
            )}
            {children}
          </div>
        </div>
      </Card>
    </div>
  )
}

export default EventInfo
