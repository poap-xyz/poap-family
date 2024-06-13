import PropTypes from 'prop-types'
import { useNavigate } from 'react-router-dom'
import { joinEventIds } from 'models/event'
import ButtonGroup from 'components/ButtonGroup'
import ButtonAdd from 'components/ButtonAdd'

/**
 * @param {PropTypes.InferProps<EventNavigateButtons.propTypes>} props
 */
function EventNavigateButtons({
  baseEventIds,
  eventId,
  children,
}) {
  const navigate = useNavigate()

  const addEvent = () => {
    navigate(`/events/${joinEventIds([...baseEventIds, eventId])}`)
  }

  return (
    <ButtonGroup>
      {baseEventIds.length > 0 && !baseEventIds.includes(eventId) && (
        <ButtonAdd
          onAdd={() => addEvent()}
          title={`Combines drop #${eventId} to #${baseEventIds.join(', #')}`}
        />
      )}
      {children}
    </ButtonGroup>
  )
}

EventNavigateButtons.propTypes = {
  baseEventIds: PropTypes.arrayOf(PropTypes.number.isRequired).isRequired,
  eventId: PropTypes.number.isRequired,
  children: PropTypes.node,
}

export default EventNavigateButtons
