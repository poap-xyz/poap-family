import { useNavigate } from 'react-router-dom'
import { joinDropIds } from 'models/drop'
import ButtonGroup from 'components/ButtonGroup'
import Button from 'components/Button'

function EventsNavigateButtons({
  baseDropIds,
  dropIds,
}: {
  baseDropIds: number[]
  dropIds: number[]
}) {
  const navigate = useNavigate()

  function addEvents(): void {
    if (dropIds.length === 0) {
      return
    }
    const newEventIds = [...baseDropIds, ...dropIds]
    if (newEventIds.length > 0) {
      navigate(`/events/${joinDropIds(newEventIds)}`)
    } else if (newEventIds.length === 1) {
      navigate(`/event/${newEventIds[0]}`)
    }
  }

  function openEvents(): void {
    if (dropIds.length === 0) {
      return
    }
    if (dropIds.length > 1) {
      navigate(`/events/${joinDropIds(dropIds)}`)
    } else if (dropIds.length === 1) {
      navigate(`/event/${dropIds[0]}`)
    }
  }

  return (
    <ButtonGroup right={true}>
      {baseDropIds.length > 0 && (
        <Button
          disabled={
            dropIds.length === 0 ||
            dropIds.every(
              (dropId) => baseDropIds.includes(dropId)
            )
          }
          onClick={() => addEvents()}
          title={`Combines drops #${dropIds.join(', #')} to #${baseDropIds.join(', #')}`}
        >
          Add selected
        </Button>
      )}
      <Button
        secondary={true}
        disabled={
          dropIds.length === 0 ||
          (
            dropIds.every(
              (dropId) => baseDropIds.includes(dropId)
            ) &&
            baseDropIds.every(
              (dropId) => dropIds.includes(dropId)
            )
          )
        }
        onClick={() => openEvents()}
        title={`Open drops #${dropIds.join(', #')}`}
      >
        Open {baseDropIds.length === 0 && ' selected'}
      </Button>
    </ButtonGroup>
  )
}

export default EventsNavigateButtons
