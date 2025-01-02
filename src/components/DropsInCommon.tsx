import { ReactNode, useMemo, useState } from 'react'
import { Drop, DropPower } from 'models/drop'
import {
  InCommon,
  filterInCommon,
  INCOMMON_DROPS_LIMIT,
  sortInCommonEntries,
} from 'models/in-common'
import { EnsByAddress } from 'models/ethereum'
import ButtonLink from 'components/ButtonLink'
import Card from 'components/Card'
import ErrorMessage from 'components/ErrorMessage'
import DropsPowers from 'components/DropsPowers'
import DropsCompare from 'components/DropsCompare'
import DropsNavigateButtons from 'components/DropsNavigateButtons'
import 'styles/in-common.css'

function DropsInCommon({
  children,
  inCommon: initialInCommon,
  drops,
  showCount,
  showActive = true,
  baseDropIds = [],
  onActive,
  dropsEnsNames,
}: {
  children?: ReactNode
  inCommon: InCommon
  drops: Record<number, Drop>
  showCount?: number
  showActive?: boolean
  baseDropIds?: number[]
  onActive?: (dropId: number) => void
  dropsEnsNames?: Record<number, EnsByAddress>
}) {
  const [showAll, setShowAll] = useState<boolean>(false)
  const [activeDropIds, setActiveDropIds] = useState<number[]>([])

  const inCommonEntries = useMemo(() =>
    sortInCommonEntries(
      Object
        .entries(filterInCommon(initialInCommon))
        .map(([rawDropId, addresses]) => [parseInt(rawDropId), addresses])
    ),
    [initialInCommon]
  )

  const inCommon = useMemo(
    () => Object.fromEntries(inCommonEntries),
    [inCommonEntries]
  )

  const inCommonLimit = useMemo(
    () => {
      if (showCount == null) {
        return INCOMMON_DROPS_LIMIT
      }
      return inCommonEntries.reduce(
        (limit, [, addresses]) => {
          if (addresses.length === showCount) {
            return limit + 1
          }
          return limit
        },
        0
      )
    },
    [inCommonEntries, showCount]
  )

  const inCommonDropsAddresses = useMemo(
    () => {
      if (!showAll && inCommonEntries.length > inCommonLimit) {
        return inCommonEntries.slice(0, inCommonLimit)
      }
      return inCommonEntries.slice()
    },
    [inCommonEntries, inCommonLimit, showAll]
  )

  const powers = useMemo(
    () => inCommonDropsAddresses.map(([dropId, addresses]): DropPower => ({
      dropId,
      power: addresses.length,
    })),
    [inCommonDropsAddresses]
  )

  function removeActiveDropId(dropId: number): void {
    setActiveDropIds((prevActiveDropIds) => {
      if (prevActiveDropIds == null) {
        return []
      }
      const newActiveDropIds = []
      for (const activeDropId of prevActiveDropIds) {
        if (activeDropId !== dropId) {
          newActiveDropIds.push(activeDropId)
        }
      }
      return newActiveDropIds
    })
  }

  function toggleActiveDropId(dropId: number): void {
    if (activeDropIds.indexOf(dropId) === -1) {
      setActiveDropIds((prevActiveDropIds) => ([
        ...(prevActiveDropIds ?? []),
        dropId,
      ]))
      if (onActive) {
        onActive(dropId)
      }
    } else {
      removeActiveDropId(dropId)
    }
  }

  const activeDropsEnsNames = useMemo(
    () => dropsEnsNames
      ? (activeDropIds.length === 0
          ? {}
          : Object.fromEntries(
              Object.entries(dropsEnsNames).filter(([rawDropId]) => {
                const dropId = parseInt(rawDropId)
                if (isNaN(dropId)) {
                  return false
                }
                return activeDropIds.includes(dropId)
              })
            )
        )
      : undefined,
    [dropsEnsNames, activeDropIds]
  )

  const inCommonTotal = inCommonEntries.length
  const hasMore = inCommonTotal > inCommonLimit

  return (
    <div className="in-common">
      <Card>
        {children}
        {inCommonTotal === 0 && (
          <ErrorMessage message="No POAPs in common" />
        )}
        {inCommonTotal > 0 && (
          <h4>
            {showCount != null && `${inCommonLimit} of `}
            {inCommonTotal}{' '}
            drop{inCommonTotal === 1 ? '' : 's'}{' '}
            in common
          </h4>
        )}
        <DropsPowers
          showAll={showAll}
          perfectPower={showCount}
          selectedDropIds={activeDropIds}
          onSelect={toggleActiveDropId}
          drops={drops}
          powers={powers}
        >
          {hasMore && (
            <div className="show-more">
              <ButtonLink
                onClick={() => setShowAll((prevShowAll) => !prevShowAll)}
              >
                {showAll
                  ? `show ${inCommonLimit}`
                  : `show all ${inCommonTotal}`
                }
              </ButtonLink>
            </div>
          )}
        </DropsPowers>
        {inCommonTotal > 0 && (
          <DropsNavigateButtons
            baseDropIds={baseDropIds}
            dropIds={activeDropIds}
          />
        )}
      </Card>
      {activeDropIds.length > 0 && showActive &&
        <DropsCompare
          baseDropIds={baseDropIds}
          dropIds={activeDropIds}
          drops={drops}
          inCommon={inCommon}
          onClose={removeActiveDropId}
          dropsEnsNames={activeDropsEnsNames}
        />
      }
    </div>
  )
}

export default DropsInCommon
