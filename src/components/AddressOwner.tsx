import { Drop } from 'models/drop'
import TokenImage from 'components/TokenImage'
import LinkToScan from 'components/LinkToScan'
import ButtonAddressProfile from 'components/ButtonAddressProfile'
import 'styles/address-owner.css'

function AddressOwner({
  ens,
  address,
  events,
  eventIds,
  ownerEventIds = [],
  inCommonEventIds = [],
  inCommonAddresses = [],
  linkToScan = false,
}: {
  ens?: string
  address: string
  events: Record<number, Drop>
  eventIds?: number[]
  ownerEventIds?: number[]
  inCommonEventIds?: number[]
  inCommonAddresses?: string[]
  linkToScan?: boolean
}) {
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
        <ButtonAddressProfile
          address={address}
          events={events}
          inCommonEventIds={inCommonEventIds}
          inCommonAddresses={inCommonAddresses}
          showEns={true}
          ens={ens}
        />
      </div>
      {linkToScan && (
        <LinkToScan
          address={address}
          className="owner-scan"
          stamp={true}
          showEns={true}
          ens={ens}
        />
      )}
      {hasEvents && (
        <div className="owner-events">
          {eventIds.map(
            (dropId) =>
              dropId in events &&
              ownerEventIds != null &&
              ownerEventIds.includes(dropId)
                ? (
                    <TokenImage
                      key={dropId}
                      drop={events[dropId]}
                      size={18}
                      resize={true}
                    />
                  )
                : <div key={dropId} className="owner-event-empty">{' '}</div>
          )}
        </div>
      )}
    </div>
  )
}

export default AddressOwner
