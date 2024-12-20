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
  baseDropIds,
  dropIds,
  drops,
  inCommon,
  onClose,
  eventsEnsNames,
}: {
  baseDropIds: number[]
  dropIds: number[]
  drops: Record<number, Drop>
  inCommon: InCommon
  onClose: (dropId: number) => void
  eventsEnsNames?: Record<number, EnsByAddress>
}) {
  const [highlighted, setHighlighted] = useState<string | null>(null)

  const adressesColors = useMemo(
    () => dropIds.length < 2
      ? {}
      : Object.fromEntries(
          intersection(
            ...dropIds.map((dropId) => inCommon[dropId])
          )
          .map(
            (address) => [
              address,
              getColorForSeed(address),
            ]
          )
        ),
    [dropIds, inCommon]
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
      {dropIds.map((dropId) =>
        <div className="event-compare" key={dropId}>
          <Card>
            <EventHeader drop={drops[dropId]} size={48} />
            <div className="event-compare-actions">
              <EventNavigateButtons
                baseDropIds={baseDropIds}
                dropId={dropId}
              >
                {onClose && (
                  <ButtonClose onClose={() => onClose(dropId)} />
                )}
              </EventNavigateButtons>
            </div>
            <h4>
              {inCommon[dropId].length}{' '}
              collector{inCommon[dropId].length === 1 ? '' : 's'}
              {' '}in common
            </h4>
            <div className="event-compare-owners">
              <ul className="owners">
                {inCommon[dropId].map((owner) => {
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
                        onOwnerEnter(dropId, owner)
                      }}
                      onMouseLeave={() => {
                        onOwnerLeave(dropId, owner)
                      }}
                    >
                      <AddressOwner
                        ens={
                          eventsEnsNames &&
                          dropId in eventsEnsNames &&
                          owner in eventsEnsNames[dropId]
                            ? eventsEnsNames[dropId][owner]
                            : undefined}
                        address={owner}
                        drops={drops}
                        inCommonDropIds={inCommonEventIds}
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
              dropId={dropId}
              dropIds={baseDropIds}
              drops={drops}
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
