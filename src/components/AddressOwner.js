import { useContext } from 'react'
import { SettingsContext } from '../stores/cache'
import { ReverseEnsContext } from '../stores/ethereum'
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
  const { ensNames } = useContext(ReverseEnsContext)
  const { settings } = useContext(SettingsContext)

  return (
    <div className="owner">
      <div className="owner-name">
        {settings && settings.openProfiles
          ? (
            <ButtonAddressProfile
              address={address}
              events={events}
              inCommonEventIds={inCommonEventIds}
            />
          )
          : (
            <a href={`${POAP_SCAN_URL}/${address}`} target="_blank" rel="noopener noreferrer">
              {address in ensNames
                ? <span className="ens" title={address}>{ensNames[address]}</span>
                : <code>{address}</code>
              }
            </a>
          )
        }
      </div>
      {linkToScan && (!settings || settings.openProfiles) && (
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
