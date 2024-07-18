import { useMemo, useState } from 'react'
import { chunks } from 'utils/array'
import { Drop } from 'models/drop'
import { InCommon } from 'models/api'
import {
  getAddressInCommonAddresses,
  getAddressInCommonEventIds,
} from 'models/in-common'
import ButtonLink from 'components/ButtonLink'
import Card from 'components/Card'
import AddressOwner from 'components/AddressOwner'
import ButtonExportAddressCsv from 'components/ButtonExportAddressCsv'
import ButtonGroup from 'components/ButtonGroup'
import ButtonExpand from 'components/ButtonExpand'
import 'styles/events-owners.css'

function inverseOwnersSortedEntries(
  owners: InCommon,
): Array<[string, number[]]> {
  const addressToEvents: Record<string, number[]> = {}
  for (const [rawEventId, addresses] of Object.entries(owners)) {
    const eventId = parseInt(rawEventId)
    for (const address of addresses) {
      if (address in addressToEvents) {
        addressToEvents[address].push(eventId)
      } else {
        addressToEvents[address] = [eventId]
      }
    }
  }
  let result = Object.entries(addressToEvents)
  result.sort((a, b) => b[1].length - a[1].length)
  return result
}

function EventsOwners({
  eventsOwners,
  inCommon,
  events,
  all = false,
}: {
  eventsOwners: InCommon
  inCommon: InCommon
  events: Record<number, Drop>
  all?: boolean
}) {
  const [showAll, setShowAll] = useState<boolean>(all)

  let ownersEvents = useMemo(
    () => inverseOwnersSortedEntries(eventsOwners),
    [eventsOwners]
  )

  const eventIds = useMemo(
    () => Object.keys(eventsOwners).map(
      (rawEventId) => parseInt(rawEventId)
    ),
    [eventsOwners]
  )

  const ownersTotal = ownersEvents.length
  const eventsTotal = eventIds.length

  const inCommonOwnersTotal = useMemo(
    () => {
      const inCommonAddresses = []
      for (const [ownerAddress, ownerEventIds] of ownersEvents) {
        if (ownerEventIds.length === eventsTotal) {
          inCommonAddresses.push(ownerAddress)
        }
      }
      return inCommonAddresses.length
    },
    [ownersEvents, eventsTotal]
  )

  if (ownersTotal > inCommonOwnersTotal && !showAll && !all) {
    ownersEvents = ownersEvents.slice(0, inCommonOwnersTotal)
  }

  const ownersEventsChunks = chunks(ownersEvents, 10)

  return (
    <div className="events-owners">
      <Card>
        {(all || showAll) && (
          <h4>{ownersTotal} collector{ownersTotal === 1 ? '' : 's'}</h4>
        )}
        {!all && !showAll && (
          <h4>
            {inCommonOwnersTotal}{' '}
            collector{inCommonOwnersTotal === 1 ? '' : 's'}{' '}
            in common
          </h4>
        )}
        <div className="events-owners-chunks">
          {ownersEventsChunks.map((ownersEventsChunk, chunkIndex) => (
            <ul key={chunkIndex}>
              {ownersEventsChunk.map(([owner, ownerEventIds]) => {
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
                  <li key={owner} className="owner-list-item">
                    <AddressOwner
                      address={owner}
                      events={events}
                      eventIds={eventIds}
                      ownerEventIds={ownerEventIds}
                      inCommonEventIds={inCommonEventIds}
                      inCommonAddresses={inCommonAddresses}
                      linkToScan={false}
                    />
                  </li>
                )
              })}
              {(
                chunkIndex + 1 === ownersEventsChunks.length &&
                ownersTotal > inCommonOwnersTotal &&
                !all
              ) && (
                <li key="show-more">
                  <div className="show-more">
                    <ButtonLink
                      onClick={() => setShowAll((prevShowAll) => !prevShowAll)}
                    >
                      {
                        showAll
                          ? (
                            inCommonOwnersTotal === 0
                              ? 'hide all'
                              : `show ${inCommonOwnersTotal}` +
                                `${all ? '' : ' in common'}`
                            )
                          : `show all ${ownersTotal}`
                      }
                    </ButtonLink>
                  </div>
                </li>
              )}
            </ul>
          ))}
        </div>
        {inCommonOwnersTotal === 0 && ownersTotal === 0 && (
          <div className="show-more">
            <ButtonLink
              onClick={() => setShowAll((prevShowAll) => !prevShowAll)}
            >
              {
                showAll
                  ? (
                      inCommonOwnersTotal === 0
                        ? 'hide all'
                        : `show ${inCommonOwnersTotal}` +
                          `${all ? '' : ' in common'}`
                    )
                  : `show all ${ownersTotal}`
              }
            </ButtonLink>
          </div>
        )}
        {ownersTotal > 0 && (
          <ButtonGroup right={true}>
            <ButtonExportAddressCsv
              filename={
                `collectors-` +
                `drop${eventsTotal === 1 ? '' : 's'}-` +
                `${eventIds.join('+')}`
              }
              name={
                eventsTotal === 1
                  ? events[eventIds[0]].name
                  : undefined
              }
              addresses={ownersEvents.map(([address]) => address)}
              title={
                `Generates CSV file with collectors in common ` +
                `between drop${eventsTotal === 1 ? '' : 's'} ` +
                `#${eventIds.join(', #')}`
              }
            />
            <ButtonExpand
              link={true}
              title={
                `Expands${showAll ? ' all' : ''} ` +
                `collectors${showAll ? '' : ' in common'} between ` +
                `drop${eventsTotal === 1 ? '' : 's'} ` +
                `#${eventIds.join(', #')}`
              }
              addresses={ownersEvents.map(([ownerAddress]) => ownerAddress)}
              eventIds={eventIds}
            />
          </ButtonGroup>
        )}
      </Card>
    </div>
  )
}

export default EventsOwners
