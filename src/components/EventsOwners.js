import { useState } from 'react'
import { chunks } from '../utils/array'
import { getAddressInCommonEventIds } from '../models/in-common'
import ButtonLink from './ButtonLink'
import Card from './Card'
import AddressOwner from './AddressOwner'
import ButtonExportAddressCsv from './ButtonExportAddressCsv'
import ButtonGroup from './ButtonGroup'
import ButtonExpand from './ButtonExpand'
import '../styles/events-owners.css'

function inverseOwnersSortedEntries(owners) {
  const addressToEvents = {}
  for (const [eventId, addresses] of Object.entries(owners)) {
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
  const [showAll, setShowAll] = useState(all)

  let ownersEntries = inverseOwnersSortedEntries(owners)

  const eventsTotal = Object.keys(owners).length
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
                  ([address, eventIds]) => (
                    <li key={address} className="owners-item">
                      <AddressOwner
                        address={address}
                        events={events}
                        eventIds={Object.keys(owners)}
                        inCommonEventIds={getAddressInCommonEventIds(inCommonEntries, address)}
                        linkToScan={false}
                      />
                    </li>
                  )
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
              eventIds={Object.keys(events)}
            />
          </ButtonGroup>
        )}
      </Card>
    </div>
  )
}

export default EventsOwners
