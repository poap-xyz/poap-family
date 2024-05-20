import { useNavigate, useParams } from 'react-router-dom'
import { parseEventIds } from 'models/event'
import PageError from 'components/PageError'

function EventsPageError() {
  const navigate = useNavigate()
  const { eventIds: rawEventIds } = useParams()

  /**
   * @param {number} eventId
   */
  const delEvent = (eventId) => {
    const eventIds = parseEventIds(rawEventIds).filter(
      (paramEventId) => String(paramEventId) !== String(eventId)
    )
    if (eventIds.length === 1) {
      navigate(`/event/${eventIds[0]}`)
    } else if (eventIds.length > 0) {
      navigate(`/events/${eventIds.join(',')}`)
    } else {
      navigate('/')
    }
  }

  /**
   * @param {number[]} eventIds
   */
  const delEvents = (eventIds) => {
    const oldEventIds = eventIds.map((eventId) => String(eventId))
    const newEventIds = parseEventIds(rawEventIds).filter(
      (paramEventId) => oldEventIds.indexOf(String(paramEventId)) === -1
    )
    if (newEventIds.length > 0) {
      navigate(`/events/${newEventIds.join(',')}`)
    } else {
      navigate('/')
    }
  }

  return <PageError onRemoveAllEvents={delEvents} onRemoveEvent={delEvent} />
}

export default EventsPageError
