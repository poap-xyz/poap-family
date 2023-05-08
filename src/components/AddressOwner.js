import { useContext } from 'react'
import { ReverseEnsContext } from '../stores/ethereum'
import TokenImage from './TokenImage'
import '../styles/owner.css'

function AddressOwner({ owner, ownerEvents, eventIds, linkToScan = true }) {
  const { ensNames } = useContext(ReverseEnsContext)

  return (
    <div className="owner">
      <div className="owner-name">
        {linkToScan
          ? (
            <a href={`https://app.poap.xyz/scan/${owner}`}>
              {owner in ensNames ? <span className="ens" title={owner}>{ensNames[owner]}</span> : <code>{owner}</code>}
            </a>
          )
          : (owner in ensNames ? <span className="ens" title={owner}>{ensNames[owner]}</span> : <code>{owner}</code>)
        }
      </div>
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
