import { clsx } from 'clsx'
import { POAP_GALLERY_URL } from '../models/poap'
import LinkButton from './LinkButton'
import '../styles/event-buttons.css'

function EventButtons({
  event,
  buttons,
  viewInGallery = true,
  invert = false,
}) {
  return (
    <div className={clsx('event-buttons', invert ? 'right' : 'left')}>
      {viewInGallery && (
        <div className="view-in-gallery">
          <LinkButton
            href={`${POAP_GALLERY_URL}/${event.id}`}
            external={true}
          >
            View in Gallery
          </LinkButton>
        </div>
      )}
      <div className="buttons">
        {buttons}
      </div>
    </div>
  )
}

export default EventButtons
