import { POAP_SCAN_URL } from '../models/poap'
import POAP_Stamp from '../images/POAP_Stamp.svg'
import TokenImage from './TokenImage'
import ButtonAddressProfile from './ButtonAddressProfile'
import '../styles/owner.css'

function AddressOwner({
  address,
  events,
  eventIds,
  inCommonEventIds = [],
  linkToScan = false,
}) {
  return (
    <div className="owner">
      <div className="owner-name">
        <ButtonAddressProfile
          address={address}
          events={events}
          inCommonEventIds={inCommonEventIds}
        />
      </div>
      {linkToScan && (
        <a className="owner-scan" href={`${POAP_SCAN_URL}/${address}`} target="_blank" rel="noopener noreferrer">
          <img src={POAP_Stamp} alt={`Scan ${address}`} />
        </a>
      )}
      {events && typeof events === 'object' && eventIds && Array.isArray(eventIds) && (
        <div className="owner-events">
          {eventIds.map(
            (eventId) => eventId in events
              ? <TokenImage key={eventId} event={events[eventId]} size={18} resize={true} />
              : <div key={eventId} className="owner-event-empty">{' '}</div>
          )}
        </div>
      )}
    </div>
  )
}

export default AddressOwner
