import PropTypes from 'prop-types'
import { POAP_GALLERY_URL } from 'models/poap'
import { DropProps } from 'models/drop'
import ButtonGroup from 'components/ButtonGroup'
import LinkButton from 'components/LinkButton'
import 'styles/event-button-group.css'

/**
 * @param {PropTypes.InferProps<EventButtonGroup.propTypes>} props
 */
function EventButtonGroup({
  event,
  children,
  viewInGallery = true,
  right = false,
}) {
  if (!viewInGallery && children == null) {
    return null
  }

  return (
    <ButtonGroup right={right}>
      {viewInGallery && (
        <LinkButton
          className="view-in-gallery"
          href={`${POAP_GALLERY_URL}/${event.id}`}
          external={true}
        >
          View in Gallery
        </LinkButton>
      )}
      {children}
    </ButtonGroup>
  )
}

EventButtonGroup.propTypes = {
  event: PropTypes.shape(DropProps).isRequired,
  children: PropTypes.node,
  viewInGallery: PropTypes.bool,
  right: PropTypes.bool,
}

export default EventButtonGroup
