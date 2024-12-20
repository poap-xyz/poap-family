import { useMemo, useState } from 'react'
import { Drop } from 'models/drop'
import {
  InCommon,
  getAddressInCommonAddresses,
  getAddressInCommonDropIds,
} from 'models/in-common'
import { EnsByAddress } from 'models/ethereum'
import { intersection } from 'utils/array'
import { getColorForSeed } from 'utils/color'
import Card from 'components/Card'
import EventHeader from 'components/EventHeader'
import AddressCollectorLine from 'components/AddressCollectorLine'
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
  dropsEnsNames,
}: {
  baseDropIds: number[]
  dropIds: number[]
  drops: Record<number, Drop>
  inCommon: InCommon
  onClose: (dropId: number) => void
  dropsEnsNames?: Record<number, EnsByAddress>
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

  function onCollectorEnter(collectorDropId: number, collector: string): void {
    setHighlighted((current) => (
      current !== collector &&
        collector in adressesColors
        ? collector
        : current
    ))
  }

  function onCollectorLeave(collectorDropId: number, collector: string): void {
    setHighlighted((current) => (
      current === collector &&
        collector in adressesColors
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
                {inCommon[dropId].map((collector) => {
                  const inCommonDropIds = getAddressInCommonDropIds(
                    inCommon,
                    collector
                  )
                  const inCommonAddresses = getAddressInCommonAddresses(
                    inCommon,
                    inCommonDropIds,
                    collector
                  )
                  return (
                    <li
                      key={collector}
                      style={{
                        backgroundColor:
                          collector in adressesColors &&
                          (
                            !highlighted ||
                            highlighted === collector
                          )
                            ? adressesColors[collector]
                            : undefined,
                      }}
                      onMouseEnter={() => {
                        onCollectorEnter(dropId, collector)
                      }}
                      onMouseLeave={() => {
                        onCollectorLeave(dropId, collector)
                      }}
                    >
                      <AddressCollectorLine
                        ens={
                          dropsEnsNames &&
                          dropId in dropsEnsNames &&
                          collector in dropsEnsNames[dropId]
                            ? dropsEnsNames[dropId][collector]
                            : undefined}
                        address={collector}
                        drops={drops}
                        inCommonDropIds={inCommonDropIds}
                        inCommonAddresses={inCommonAddresses}
                        linkToScan={
                          !highlighted || highlighted === collector}
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
