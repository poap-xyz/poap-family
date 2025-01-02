import { useMemo, useState } from 'react'
import { chunks, uniq } from 'utils/array'
import { Drop } from 'models/drop'
import {
  InCommon,
  getAddressInCommonAddresses,
  getAddressInCommonDropIds,
} from 'models/in-common'
import ButtonLink from 'components/ButtonLink'
import Card from 'components/Card'
import AddressCollectorLine from 'components/AddressCollectorLine'
import ButtonExportAddressCsv from 'components/ButtonExportAddressCsv'
import ButtonGroup from 'components/ButtonGroup'
import ButtonExpand from 'components/ButtonExpand'
import 'styles/drops-collectors.css'

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

function DropsCollectors({
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

  const collectors = useMemo(
    () => uniq(collectorsDrops.map(
      ([collectorAddress]) => collectorAddress
    )),
    [collectorsDrops]
  )

  const collectorsTotal = collectors.length
  const dropsTotal = dropIds.length

  const inCommonCollectorsTotal = useMemo(
    () => {
      const inCommonAddresses = []
      for (const [collectorAddress, collectorDropIds] of collectorsDrops) {
        if (collectorDropIds.length === dropsTotal) {
          inCommonAddresses.push(collectorAddress)
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
    <div className="drops-collectors">
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
        <div className="drops-collectors-chunks">
          {collectorsDropsChunks.map((collectorsDropsChunk, chunkIndex) => (
            <ul key={chunkIndex}>
              {collectorsDropsChunk.map(([collector, collectorDropIds]) => {
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
                  <li key={collector} className="owner-list-item">
                    <AddressCollectorLine
                      address={collector}
                      drops={drops}
                      dropIds={dropIds}
                      collectorsDropIds={collectorDropIds}
                      inCommonDropIds={inCommonDropIds}
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
              addresses={collectors}
              dropIds={dropIds}
            />
          </ButtonGroup>
        )}
      </Card>
    </div>
  )
}

export default DropsCollectors
