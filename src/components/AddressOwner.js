import { POAP_SCAN_URL } from '../models/poap'
import POAP_Stamp from '../images/POAP_Stamp.svg'
import TokenImage from './TokenImage'
import ButtonAddressProfile from './ButtonAddressProfile'
import '../styles/owner.css'

function AddressOwner({ owner, ownerEvents, eventIds, linkToScan = false }) {
  return (
    <div className="owner">
      <div className="owner-name">
        <ButtonAddressProfile address={owner} />
      </div>
      {linkToScan && (
        <a className="owner-scan" href={`${POAP_SCAN_URL}/${owner}`} target="_blank" rel="noopener noreferrer">
          <img src={POAP_Stamp} alt={`Scan ${owner}`} />
        </a>
      )}
      {ownerEvents && typeof ownerEvents === 'object' && eventIds && Array.isArray(eventIds) && (
        <div className="owner-events">
          {eventIds.map(
            (eventId) => eventId in ownerEvents
              ? <TokenImage key={eventId} event={ownerEvents[eventId]} size={18} resize={true} />
              : <div key={eventId} className="owner-event-empty">{' '}</div>
          )}
        </div>
      )}
    </div>
  )
}

export default AddressOwner
