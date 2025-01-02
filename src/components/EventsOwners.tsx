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
  dropsOwners,
  inCommon,
  drops,
  all = false,
}: {
  dropsOwners: InCommon
  inCommon: InCommon
  drops: Record<number, Drop>
  all?: boolean
}) {
  const [showAll, setShowAll] = useState<boolean>(all)

  let ownersDrops = useMemo(
    () => inverseCollectorsSortedEntries(dropsOwners),
    [dropsOwners]
  )

  const dropIds = useMemo(
    () => Object.keys(dropsOwners).map(
      (rawDropId) => parseInt(rawDropId)
    ),
    [dropsOwners]
  )

  const ownersTotal = ownersDrops.length
  const dropsTotal = dropIds.length

  const inCommonOwnersTotal = useMemo(
    () => {
      const inCommonAddresses = []
      for (const [ownerAddress, ownerEventIds] of ownersDrops) {
        if (ownerEventIds.length === dropsTotal) {
          inCommonAddresses.push(ownerAddress)
        }
      }
      return inCommonAddresses.length
    },
    [ownersDrops, dropsTotal]
  )

  if (ownersTotal > inCommonOwnersTotal && !showAll && !all) {
    ownersDrops = ownersDrops.slice(0, inCommonOwnersTotal)
  }

  const ownersDropsChunks = chunks(ownersDrops, 10)

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
          {ownersDropsChunks.map((ownersDropsChunk, chunkIndex) => (
            <ul key={chunkIndex}>
              {ownersDropsChunk.map(([owner, ownerEventIds]) => {
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
                chunkIndex + 1 === ownersDropsChunks.length &&
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
                `drop${dropsTotal === 1 ? '' : 's'}-` +
                `${dropIds.join('+')}`
              }
              name={
                dropsTotal === 1
                  ? drops[dropIds[0]].name
                  : undefined
              }
              addresses={ownersDrops.map(([address]) => address)}
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
              addresses={ownersDrops.map(([ownerAddress]) => ownerAddress)}
              dropIds={dropIds}
            />
          </ButtonGroup>
        )}
      </Card>
    </div>
  )
}

export default EventsOwners
