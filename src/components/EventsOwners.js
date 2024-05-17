import PropTypes from 'prop-types'
import { useState } from 'react'
import { chunks } from '../utils/array'
import { DropProps } from '../models/drop'
import { filterInCommon, getAddressInCommonAddresses, getAddressInCommonEventIds, sortInCommonEntries } from '../models/in-common'
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

/**
 * @param {PropTypes.InferProps<EventsOwners.propTypes>} props
 */
function EventsOwners({
  children,
  owners,
  inCommon: initialInCommon = {},
  events = {},
  all = false,
}) {
  /**
   * @type {ReturnType<typeof useState<boolean>>}
   */
  const [showAll, setShowAll] = useState(all)

  let ownersEntries = inverseOwnersSortedEntries(owners)

  const ownersEventIds = Object.keys(owners).map(
    (rawEventId) => parseInt(rawEventId)
  )

  const eventsTotal = ownersEventIds.length
  const ownersTotal = ownersEntries.length

  /**
   * @type {string[]}
   */
  const inCommonAddresses = []

  for (const [ownerAddress, ownerEventIds] of ownersEntries) {
    if (ownerEventIds.length === eventsTotal) {
      inCommonAddresses.push(ownerAddress)
    }
  }

  const inCommonOwnersTotal = inCommonAddresses.length

  if (ownersTotal > inCommonOwnersTotal && !showAll && !all) {
    ownersEntries = ownersEntries.slice(0, inCommonOwnersTotal)
  }

  const ownersEntriesChunks = chunks(ownersEntries, 10)

  const inCommonEntries = sortInCommonEntries(
    Object
      .entries(filterInCommon(initialInCommon))
      .map(([rawEventId, addresses]) => [parseInt(rawEventId), addresses])
  )

  const inCommon = Object.fromEntries(inCommonEntries)

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
                      inCommon,
                      address
                    )
                    const inCommonAddresses = getAddressInCommonAddresses(
                      inCommon,
                      inCommonEventIds,
                      address
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
              title={`Generates CSV file with collectors in common between drop${Object.keys(events).length === 1 ? '' : 's'} #${Object.keys(events).join(', #')}`}
            />
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

EventsOwners.propTypes = {
  children: PropTypes.node,
  owners: PropTypes.objectOf(PropTypes.arrayOf(PropTypes.string)).isRequired,
  inCommon: PropTypes.objectOf(PropTypes.arrayOf(PropTypes.string)),
  events: PropTypes.objectOf(PropTypes.shape(DropProps)),
  all: PropTypes.bool,
}

export default EventsOwners
