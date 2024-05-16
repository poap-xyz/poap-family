import PropTypes from 'prop-types'
import { useContext } from 'react'
import { SettingsContext } from '../stores/cache'
import { ReverseEnsContext } from '../stores/ethereum'
import { POAP_SCAN_URL } from '../models/poap'
import { DropProps } from '../models/drop'
import POAP_Stamp from '../images/POAP_Stamp.svg'
import TokenImage from './TokenImage'
import ButtonAddressProfile from './ButtonAddressProfile'
import '../styles/owner.css'

/**
 * @param {PropTypes.InferProps<AddressOwner.propTypes>} props
 */
function AddressOwner({
  address,
  events,
  eventIds,
  ownerEventIds = [],
  inCommonEventIds = [],
  inCommonAddresses = [],
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
              inCommonAddresses={inCommonAddresses}
            />
          )
          : (
            <a href={`${POAP_SCAN_URL}/${address}`} title={`Scan ${address in ensNames ? ensNames[address] : address}`} target="_blank" rel="noopener noreferrer">
              {address in ensNames
                ? <span className="ens">{ensNames[address]}</span>
                : <code>{address}</code>
              }
            </a>
          )
        }
      </div>
      {linkToScan && (!settings || settings.openProfiles) && (
        <a className="owner-scan" href={`${POAP_SCAN_URL}/${address}`} title={`Scan ${address in ensNames ? ensNames[address] : address}`} target="_blank" rel="noopener noreferrer">
          <img src={POAP_Stamp} alt={`Scan ${address}`} />
        </a>
      )}
      {events && typeof events === 'object' && eventIds && Array.isArray(eventIds) && (
        <div className="owner-events">
          {eventIds.map(
            (eventId) => eventId in events && ownerEventIds.indexOf(eventId) !== -1
              ? <TokenImage key={eventId} event={events[eventId]} size={18} resize={true} />
              : <div key={eventId} className="owner-event-empty">{' '}</div>
          )}
        </div>
      )}
    </div>
  )
}

AddressOwner.propTypes = {
  address: PropTypes.string.isRequired,
  events: PropTypes.objectOf(PropTypes.shape(DropProps)),
  eventIds: PropTypes.arrayOf(PropTypes.number),
  ownerEventIds: PropTypes.arrayOf(PropTypes.number),
  inCommonEventIds: PropTypes.arrayOf(PropTypes.number),
  inCommonAddresses: PropTypes.arrayOf(PropTypes.string),
  linkToScan: PropTypes.bool,
}

export default AddressOwner
