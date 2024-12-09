import { useMemo, useState } from 'react'
import { Drop } from 'models/drop'
import { InCommon } from 'models/api'
import {
  getAddressInCommonAddresses,
  getAddressInCommonEventIds,
} from 'models/in-common'
import { EnsByAddress } from 'models/ethereum'
import { intersection } from 'utils/array'
import { getColorForSeed } from 'utils/color'
import Card from 'components/Card'
import EventHeader from 'components/EventHeader'
import AddressOwner from 'components/AddressOwner'
import EventCompareButtons from 'components/EventCompareButtons'
import EventNavigateButtons from 'components/EventNavigateButtons'
import ButtonClose from 'components/ButtonClose'
import 'styles/events-compare.css'

function EventsCompare({
  baseEventIds,
  eventIds,
  events,
  inCommon,
  onClose,
  eventsEnsNames,
}: {
  baseEventIds: number[]
  eventIds: number[]
  events: Record<number, Drop>
  inCommon: InCommon
  onClose: (eventId: number) => void
  eventsEnsNames?: Record<number, EnsByAddress>
}) {
  const [highlighted, setHighlighted] = useState<string | null>(null)

  const adressesColors = useMemo(
    () => eventIds.length < 2
      ? {}
      : Object.fromEntries(
          intersection(
            ...eventIds.map((eventId) => inCommon[eventId])
          )
          .map(
            (address) => [
              address,
              getColorForSeed(address),
            ]
          )
        ),
    [eventIds, inCommon]
  )

  function onOwnerEnter(ownerEventId: number, owner: string): void {
    setHighlighted((current) => (
      current !== owner &&
        owner in adressesColors
        ? owner
        : current
    ))
  }

  function onOwnerLeave(ownerEventId: number, owner: string): void {
    setHighlighted((current) => (
      current === owner &&
        owner in adressesColors
        ? null
        : current
    ))
  }

  return (
    <div className="events-compare">
      {eventIds.map((eventId) =>
        <div className="event-compare" key={eventId}>
          <Card>
            <EventHeader event={events[eventId]} size={48} />
            <div className="event-compare-actions">
              <EventNavigateButtons
                baseEventIds={baseEventIds}
                eventId={eventId}
              >
                {onClose && (
                  <ButtonClose onClose={() => onClose(eventId)} />
                )}
              </EventNavigateButtons>
            </div>
            <h4>
              {inCommon[eventId].length}{' '}
              collector{inCommon[eventId].length === 1 ? '' : 's'}
              {' '}in common
            </h4>
            <div className="event-compare-owners">
              <ul className="owners">
                {inCommon[eventId].map((owner) => {
                  const inCommonEventIds = getAddressInCommonEventIds(
                    inCommon,
                    owner
                  )
                  const inCommonAddresses = getAddressInCommonAddresses(
                    inCommon,
                    inCommonEventIds,
                    owner
                  )
                  return (
                    <li
                      key={owner}
                      style={{
                        backgroundColor:
                          owner in adressesColors &&
                          (
                            !highlighted ||
                            highlighted === owner
                          )
                            ? adressesColors[owner]
                            : undefined,
                      }}
                      onMouseEnter={() => {
                        onOwnerEnter(eventId, owner)
                      }}
                      onMouseLeave={() => {
                        onOwnerLeave(eventId, owner)
                      }}
                    >
                      <AddressOwner
                        ens={
                          eventsEnsNames &&
                          eventId in eventsEnsNames &&
                          owner in eventsEnsNames[eventId]
                            ? eventsEnsNames[eventId][owner]
                            : undefined}
                        address={owner}
                        events={events}
                        inCommonEventIds={inCommonEventIds}
                        inCommonAddresses={inCommonAddresses}
                        linkToScan={
                          !highlighted || highlighted === owner}
                      />
                    </li>
                  )
                })}
              </ul>
            </div>
            <EventCompareButtons
              eventId={eventId}
              eventIds={baseEventIds}
              events={events}
              inCommon={inCommon}
              viewInGallery={true}
            />
          </Card>
        </div>
      )}
    </div>
  )
}

export default EventsCompare
