import PropTypes from 'prop-types'
import { DropProps } from 'models/drop'
import EventButtonGroup from 'components/EventButtonGroup'
import ButtonExportAddressCsv from 'components/ButtonExportAddressCsv'
import ButtonExpand from 'components/ButtonExpand'

/**
 * @param {PropTypes.InferProps<EventCompareButtons.propTypes>} props
 */
function EventCompareButtons({
  eventId,
  eventIds,
  events,
  inCommon,
  viewInGallery = true,
}) {
  const compareItself = (
    eventIds.length === 1 && String(eventId) === String(eventIds[0])
  )

  return (
    <EventButtonGroup
      event={events[eventId]}
      viewInGallery={viewInGallery}
    >
      {eventIds.length > 0 && (
        <>
          <ButtonExportAddressCsv
            filename={
              compareItself
                ? `collectors-${eventId}`
                : `collectors-${eventId}-in-common-drops-${eventIds.join('+')}`
            }
            name={
              compareItself
                ? events[eventIds[0]].name
                : undefined
            }
            addresses={inCommon[eventId]}
            title={
              compareItself
                ? `Generates CSV file with collectors of drop #${eventId}`
                : `Generates CSV file with collectors in common between ` +
                  `drops #${eventId} and #${eventIds.join(', #')}`
            }
          />
          <ButtonExpand
            addresses={inCommon[eventId]}
            title={
              compareItself
                ? `Expands collectors of drop #${eventId}`
                : `Expands collectors in common between ` +
                  `drops #${eventId} and #${eventIds.join(', #')}`
            }
          />
        </>
      )}
    </EventButtonGroup>
  )
}

EventCompareButtons.propTypes = {
  eventId: PropTypes.number.isRequired,
  eventIds: PropTypes.arrayOf(PropTypes.number.isRequired).isRequired,
  events: PropTypes.objectOf(
    PropTypes.shape(DropProps).isRequired
  ).isRequired,
  inCommon: PropTypes.objectOf(
    PropTypes.arrayOf(
      PropTypes.string.isRequired
    ).isRequired
  ).isRequired,
  viewInGallery: PropTypes.bool,
}

export default EventCompareButtons
