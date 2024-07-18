import { useSettings } from 'stores/settings'
import { Drop } from 'models/drop'
import TokenImage from 'components/TokenImage'
import LinkToScan from 'components/LinkToScan'
import ButtonAddressProfile from 'components/ButtonAddressProfile'
import 'styles/address-owner.css'

function AddressOwner({
  address,
  events,
  eventIds,
  ownerEventIds = [],
  inCommonEventIds = [],
  inCommonAddresses = [],
  linkToScan = false,
}: {
  address: string
  events: Record<number, Drop>
  eventIds?: number[]
  ownerEventIds?: number[]
  inCommonEventIds?: number[]
  inCommonAddresses?: string[]
  linkToScan?: boolean
}) {
  const { settings } = useSettings()

  const hasEvents = (
    events != null &&
    typeof events === 'object' &&
    eventIds != null &&
    Array.isArray(eventIds) &&
    eventIds.length > 0
  )

  return (
    <div className="address-owner">
      <div className="owner-name">
        {settings.openProfiles
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
      {linkToScan && settings.openProfiles && (
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

export default AddressOwner
