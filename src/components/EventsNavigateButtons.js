import PropTypes from 'prop-types'
import { useNavigate } from 'react-router-dom'
import { joinEventIds } from 'models/event'
import ButtonGroup from 'components/ButtonGroup'
import Button from 'components/Button'

/**
 * @param {PropTypes.InferProps<EventsNavigateButtons.propTypes>} props
 */
function EventsNavigateButtons({
  baseEventIds,
  eventIds,
}) {
  const navigate = useNavigate()

  const addEvents = () => {
    if (eventIds.length === 0) {
      return
    }
    const newEventIds = [...baseEventIds, ...eventIds]
    if (newEventIds.length > 0) {
      navigate(`/events/${joinEventIds(newEventIds)}`)
    } else if (newEventIds.length === 1) {
      navigate(`/event/${newEventIds[0]}`)
    }
  }

  const openEvents = () => {
    if (eventIds.length === 0) {
      return
    }
    if (eventIds.length > 1) {
      navigate(`/events/${joinEventIds(eventIds)}`)
    } else if (eventIds.length === 1) {
      navigate(`/event/${eventIds[0]}`)
    }
  }

  return (
    <ButtonGroup right={true}>
      {baseEventIds.length > 0 && (
        <Button
          disabled={
            eventIds.length === 0 ||
            eventIds.every(
              (eventId) => baseEventIds.includes(eventId)
            )
          }
          onClick={() => addEvents()}
          title={`Combines drops #${eventIds.join(', #')} to #${baseEventIds.join(', #')}`}
        >
          Add selected
        </Button>
      )}
      <Button
        secondary={true}
        disabled={
          eventIds.length === 0 ||
          (
            eventIds.every(
              (eventId) => baseEventIds.includes(eventId)
            ) &&
            baseEventIds.every(
              (eventId) => eventIds.includes(eventId)
            )
          )
        }
        onClick={() => openEvents()}
        title={`Open drops #${eventIds.join(', #')}`}
      >
        Open {baseEventIds.length === 0 && ' selected'}
      </Button>
    </ButtonGroup>
  )
}

EventsNavigateButtons.propTypes = {
  baseEventIds: PropTypes.arrayOf(PropTypes.number.isRequired).isRequired,
  eventIds: PropTypes.arrayOf(PropTypes.number.isRequired).isRequired,
}

export default EventsNavigateButtons
