import PropTypes from 'prop-types'
import { useContext } from 'react'
import { SettingsContext } from 'stores/cache'
import { DropProps } from 'models/drop'
import TokenImage from 'components/TokenImage'
import LinkToScan from 'components/LinkToScan'
import ButtonAddressProfile from 'components/ButtonAddressProfile'
import 'styles/owner.css'

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
  const { settings } = useContext(SettingsContext)

  const hasEvents = (
    events != null &&
    typeof events === 'object' &&
    eventIds != null &&
    Array.isArray(eventIds) &&
    eventIds.length > 0
  )

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
          : <LinkToScan address={address} />
        }
      </div>
      {linkToScan && (!settings || settings.openProfiles) && (
        <LinkToScan address={address} className="owner-scan" stamp={true} />
      )}
      {hasEvents && (
        <div className="owner-events">
          {eventIds.map(
            (eventId) =>
              eventId in events &&
              ownerEventIds != null &&
              ownerEventIds.includes(eventId)
                ? (
                    <TokenImage
                      key={eventId}
                      event={events[eventId]}
                      size={18}
                      resize={true}
                    />
                  )
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
