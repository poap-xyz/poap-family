import { useState } from 'react'
import { chunks } from '../utils/array'
import { getAddressInCommonEventIds, mergeAddressesInCommon } from '../models/in-common'
import ButtonLink from './ButtonLink'
import Card from './Card'
import AddressOwner from './AddressOwner'
import ButtonExportAddressCsv from './ButtonExportAddressCsv'
import ButtonGroup from './ButtonGroup'
import ButtonExpand from './ButtonExpand'
import '../styles/events-owners.css'

/**
 * @param {Record<number, string[]>} owners
 * @returns {Array<[string, number[]]>}
 */
function inverseOwnersSortedEntries(owners) {
  /**
   * @type {Record<string, number[]>}
   */
  const addressToEvents = {}
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
  children,
  owners = {},
  inCommon = {},
  events = {},
  all = false,
}) {
  /**
   * @type {ReturnType<typeof useState<boolean>>}
   */
  const [showAll, setShowAll] = useState(all)

  let ownersEntries = inverseOwnersSortedEntries(owners)

  const ownersEventIds = Object.keys(owners).map((rawEventId) => parseInt(rawEventId))

  const eventsTotal = ownersEventIds.length
  const ownersTotal = ownersEntries.length

  const inCommonAddresses = []
  let inCommonOwnersTotal = 0

  for (const [ownerAddress, ownerEventIds] of ownersEntries) {
    if (ownerEventIds.length === eventsTotal) {
      inCommonAddresses.push(ownerAddress)
      inCommonOwnersTotal++
    }
  }

  if (ownersTotal > inCommonOwnersTotal && !showAll && !all) {
    ownersEntries = ownersEntries.slice(0, inCommonOwnersTotal)
  }

  const ownersEntriesChunks = chunks(ownersEntries, 10)
  const inCommonEntries = Object.entries(inCommon)

  return (
    <div className="events-owners">
      <Card>
        {(all || showAll) && <h4>{ownersTotal} collector{ownersTotal === 1 ? '' : 's'}</h4>}
        {!all && !showAll && <h4>{inCommonOwnersTotal} collector{inCommonOwnersTotal === 1 ? '' : 's'} in common</h4>}
        {children}
        <div className="in-common-owners">
          {ownersEntriesChunks.map(
            (ownersEntriesChunk, chunkIndex) => (
              <ul key={chunkIndex} className="owners">
                {ownersEntriesChunk.map(
                  ([address, eventIds]) => {
                    const inCommonEventIds = getAddressInCommonEventIds(
                      Object.fromEntries(inCommonEntries),
                      address
                    )
                    const inCommonAddresses = inCommonEventIds.length < 2 ? [] : mergeAddressesInCommon(
                      Object.fromEntries(
                        inCommonEntries.filter(
                          ([inCommonEventId]) => inCommonEventIds.includes(parseInt(inCommonEventId))
                        )
                      )
                    ).filter(
                      (inCommonAddress) => inCommonAddress.toLowerCase() !== address.toLowerCase()
                    )
                    return (
                      <li key={address} className="owners-item">
                        <AddressOwner
                          address={address}
                          events={events}
                          eventIds={ownersEventIds}
                          ownerEventIds={eventIds}
                          inCommonEventIds={inCommonEventIds}
                          inCommonAddresses={inCommonAddresses}
                          linkToScan={false}
                        />
                      </li>
                    )
                  }
                )}
                {chunkIndex + 1 === ownersEntriesChunks.length && ownersTotal > inCommonOwnersTotal && !all && (
                  <li key="show-more">
                    <div className="show-more">
                      <ButtonLink onClick={() => setShowAll((prevShowAll) => !prevShowAll)}>
                        {showAll ? (inCommonOwnersTotal === 0 ? 'hide all' : `show ${inCommonOwnersTotal}${all ? '' : ' in common'}`) : `show all ${ownersTotal}`}
                      </ButtonLink>
                    </div>
                  </li>
                )}
              </ul>
            )
          )}
        </div>
        {inCommonOwnersTotal === 0 && ownersEntries.length === 0 && (
          <div className="show-more">
            <ButtonLink onClick={() => setShowAll((prevShowAll) => !prevShowAll)}>
              {showAll ? (inCommonOwnersTotal === 0 ? 'hide all' : `show ${inCommonOwnersTotal}${all ? '' : ' in common'}`) : `show all ${ownersTotal}`}
            </ButtonLink>
          </div>
        )}
        {ownersEntries.length > 0 && (
          <ButtonGroup right={true}>
            <ButtonExportAddressCsv
              filename={`collectors-drop${Object.keys(events).length === 1 ? '' : 's'}-${Object.keys(events).join('+')}`}
              name={Object.keys(events).length === 1 ? Object.values(events)[0].name : undefined}
              addresses={ownersEntries.map(([address]) => address)}
              secondary={true}
              title={`Generates CSV file with collectors in common between drop${Object.keys(events).length === 1 ? '' : 's'} #${Object.keys(events).join(', #')}`}
            >
              export csv
            </ButtonExportAddressCsv>
            <ButtonExpand
              link={true}
              title={`Expands${showAll ? ' all' : ''} collectors${showAll ? '' : ' in common'} between drop${Object.keys(events).length === 1 ? '' : 's'} #${Object.keys(events).join(', #')}`}
              addresses={ownersEntries.map(([ownerAddress]) => ownerAddress)}
              eventIds={ownersEventIds}
            />
          </ButtonGroup>
        )}
      </Card>
    </div>
  )
}

export default EventsOwners
