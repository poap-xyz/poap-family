import { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { joinEventIds } from 'models/event'
import ButtonGroup from 'components/ButtonGroup'
import ButtonAdd from 'components/ButtonAdd'

function EventNavigateButtons({
  baseEventIds,
  eventId,
  children,
}: {
  baseEventIds: number[]
  eventId: number
  children?: ReactNode
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

export default EventNavigateButtons
