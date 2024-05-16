import PropTypes from 'prop-types'
import { clsx } from 'clsx'
import { POAP_GALLERY_URL } from '../models/poap'
import { DropProps } from '../models/drop'
import LinkButton from './LinkButton'
import '../styles/event-buttons.css'

/**
 * @param {PropTypes.InferProps<EventButtons.propTypes>} props
 */
function EventButtons({
  event,
  buttons,
  viewInGallery = true,
  invert = false,
}) {
  if (!viewInGallery && !buttons) {
    return null
  }

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
      {buttons && (
        <div className="buttons">
          {buttons}
        </div>
      )}
    </div>
  )
}

EventButtons.propTypes = {
  event: PropTypes.shape(DropProps).isRequired,
  buttons: PropTypes.node,
  viewInGallery: PropTypes.bool,
  invert: PropTypes.bool,
}

export default EventButtons
