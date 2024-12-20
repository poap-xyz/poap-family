import { useMemo, useState } from 'react'
import { chunks } from 'utils/array'
import { Drop } from 'models/drop'
import {
  InCommon,
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

function inverseCollectorsSortedEntries(
  inCommon: InCommon,
): Array<[string, number[]]> {
  const addressToDropIds: Record<string, number[]> = {}
  for (const [rawDropId, addresses] of Object.entries(inCommon)) {
    const dropId = parseInt(rawDropId)
    for (const address of addresses) {
      if (address in addressToDropIds) {
        addressToDropIds[address].push(dropId)
      } else {
        addressToDropIds[address] = [dropId]
      }
    }
  }
  let result = Object.entries(addressToDropIds)
  result.sort((a, b) => b[1].length - a[1].length)
  return result
}

function EventsOwners({
  dropsCollectors,
  inCommon,
  drops,
  all = false,
}: {
  dropsCollectors: InCommon
  inCommon: InCommon
  drops: Record<number, Drop>
  all?: boolean
}) {
  const [showAll, setShowAll] = useState<boolean>(all)

  let collectorsDrops = useMemo(
    () => inverseCollectorsSortedEntries(dropsCollectors),
    [dropsCollectors]
  )

  const dropIds = useMemo(
    () => Object.keys(dropsCollectors).map(
      (rawDropId) => parseInt(rawDropId)
    ),
    [dropsCollectors]
  )

  const collectorsTotal = collectorsDrops.length
  const dropsTotal = dropIds.length

  const inCommonCollectorsTotal = useMemo(
    () => {
      const inCommonAddresses = []
      for (const [ownerAddress, ownerEventIds] of collectorsDrops) {
        if (ownerEventIds.length === dropsTotal) {
          inCommonAddresses.push(ownerAddress)
        }
      }
      return inCommonAddresses.length
    },
    [collectorsDrops, dropsTotal]
  )

  if (collectorsTotal > inCommonCollectorsTotal && !showAll && !all) {
    collectorsDrops = collectorsDrops.slice(0, inCommonCollectorsTotal)
  }

  const collectorsDropsChunks = chunks(collectorsDrops, 10)

  return (
    <div className="events-owners">
      <Card>
        {(all || showAll) && (
          <h4>{collectorsTotal} collector{collectorsTotal === 1 ? '' : 's'}</h4>
        )}
        {!all && !showAll && (
          <h4>
            {inCommonCollectorsTotal}{' '}
            collector{inCommonCollectorsTotal === 1 ? '' : 's'}{' '}
            in common
          </h4>
        )}
        <div className="events-owners-chunks">
          {collectorsDropsChunks.map((collectorsDropsChunk, chunkIndex) => (
            <ul key={chunkIndex}>
              {collectorsDropsChunk.map(([owner, ownerEventIds]) => {
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
                      drops={drops}
                      dropIds={dropIds}
                      collectorsDropIds={ownerEventIds}
                      inCommonDropIds={inCommonEventIds}
                      inCommonAddresses={inCommonAddresses}
                      linkToScan={false}
                    />
                  </li>
                )
              })}
              {(
                chunkIndex + 1 === collectorsDropsChunks.length &&
                collectorsTotal > inCommonCollectorsTotal &&
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
                            inCommonCollectorsTotal === 0
                              ? 'hide all'
                              : `show ${inCommonCollectorsTotal}` +
                                `${all ? '' : ' in common'}`
                            )
                          : `show all ${collectorsTotal}`
                      }
                    </ButtonLink>
                  </div>
                </li>
              )}
            </ul>
          ))}
        </div>
        {inCommonCollectorsTotal === 0 && collectorsTotal === 0 && (
          <div className="show-more">
            <ButtonLink
              onClick={() => setShowAll((prevShowAll) => !prevShowAll)}
            >
              {
                showAll
                  ? (
                      inCommonCollectorsTotal === 0
                        ? 'hide all'
                        : `show ${inCommonCollectorsTotal}` +
                          `${all ? '' : ' in common'}`
                    )
                  : `show all ${collectorsTotal}`
              }
            </ButtonLink>
          </div>
        )}
        {collectorsTotal > 0 && (
          <ButtonGroup right={true}>
            <ButtonExportAddressCsv
              filename={
                `collectors-` +
                `drop${dropsTotal === 1 ? '' : 's'}-` +
                `${dropIds.join('+')}`
              }
              name={
                dropsTotal === 1
                  ? drops[dropIds[0]].name
                  : undefined
              }
              addresses={collectorsDrops.map(([address]) => address)}
              title={
                `Generates CSV file with collectors in common ` +
                `between drop${dropsTotal === 1 ? '' : 's'} ` +
                `#${dropIds.join(', #')}`
              }
            />
            <ButtonExpand
              link={true}
              title={
                `Expands${showAll ? ' all' : ''} ` +
                `collectors${showAll ? '' : ' in common'} between ` +
                `drop${dropsTotal === 1 ? '' : 's'} ` +
                `#${dropIds.join(', #')}`
              }
              addresses={collectorsDrops.map(([ownerAddress]) => ownerAddress)}
              dropIds={dropIds}
            />
          </ButtonGroup>
        )}
      </Card>
    </div>
  )
}

export default EventsOwners
