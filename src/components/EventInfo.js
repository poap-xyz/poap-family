import Ilustration from '../images/Illustration_Cities_BuenosAires.png'
import Card from './Card'
import Stats from './Stats'
import TokenImageZoom from './TokenImageZoom'
import EventButtons from './EventButtons'
import '../styles/event-info.css'

function EventInfo({ event, stats = {}, highlightStat, buttons = [], children }) {
  return (
    <Card style={{ backgroundImage: `url(${Ilustration})`, backgroundPosition: '-3rem -8rem' }}>
      <div className="event-info">
        <div className="event-image">
          <TokenImageZoom event={event} zoomSize={512} size={128} />
        </div>
        <div className="event-data">
          <h1>{event.name}</h1>
          <div className="event-date">{event.start_date}</div>
          {event.city && event.country && <div className="place">{event.city}, {event.country}</div>}
          <Stats stats={stats} highlight={highlightStat} />
          <EventButtons event={event} buttons={buttons} viewInGallery={true} />
          {children}
        </div>
      </div>
    </Card>
  )
}

export default EventInfo
