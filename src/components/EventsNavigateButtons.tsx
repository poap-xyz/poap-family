import { useNavigate } from 'react-router-dom'
import { joinDropIds } from 'models/drop'
import ButtonGroup from 'components/ButtonGroup'
import Button from 'components/Button'

function EventsNavigateButtons({
  baseEventIds,
  eventIds,
}: {
  baseEventIds: number[]
  eventIds: number[]
}) {
  const navigate = useNavigate()

  function addEvents(): void {
    if (eventIds.length === 0) {
      return
    }
    const newEventIds = [...baseEventIds, ...eventIds]
    if (newEventIds.length > 0) {
      navigate(`/events/${joinDropIds(newEventIds)}`)
    } else if (newEventIds.length === 1) {
      navigate(`/event/${newEventIds[0]}`)
    }
  }

  function openEvents(): void {
    if (eventIds.length === 0) {
      return
    }
    if (eventIds.length > 1) {
      navigate(`/events/${joinDropIds(eventIds)}`)
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
              (dropId) => baseEventIds.includes(dropId)
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
              (dropId) => baseEventIds.includes(dropId)
            ) &&
            baseEventIds.every(
              (dropId) => eventIds.includes(dropId)
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

export default EventsNavigateButtons
