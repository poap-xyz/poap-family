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
import EventsPowers from 'components/EventsPowers'
import EventsCompare from 'components/EventsCompare'
import EventsNavigateButtons from 'components/EventsNavigateButtons'
import 'styles/in-common.css'

function EventsInCommon({
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
  const [activeEventIds, setActiveEventIds] = useState<number[]>([])

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
    setActiveEventIds((prevActiveEventIds) => {
      if (prevActiveEventIds == null) {
        return []
      }
      const newActiveEventIds = []
      for (const activeEventId of prevActiveEventIds) {
        if (activeEventId !== dropId) {
          newActiveEventIds.push(activeEventId)
        }
      }
      return newActiveEventIds
    })
  }

  function toggleActiveDropId(dropId: number): void {
    if (activeEventIds.indexOf(dropId) === -1) {
      setActiveEventIds((prevActiveEventIds) => ([
        ...(prevActiveEventIds ?? []),
        dropId,
      ]))
      if (onActive) {
        onActive(dropId)
      }
    } else {
      removeActiveDropId(dropId)
    }
  }

  const activeEventsEnsNames = useMemo(
    () => dropsEnsNames
      ? (activeEventIds.length === 0
          ? {}
          : Object.fromEntries(
              Object.entries(dropsEnsNames).filter(([rawDropId]) => {
                const dropId = parseInt(rawDropId)
                if (isNaN(dropId)) {
                  return false
                }
                return activeEventIds.includes(dropId)
              })
            )
        )
      : undefined,
    [dropsEnsNames, activeEventIds]
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
        <EventsPowers
          showAll={showAll}
          perfectPower={showCount}
          selectedDropIds={activeEventIds}
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
        </EventsPowers>
        {inCommonTotal > 0 && (
          <EventsNavigateButtons
            baseDropIds={baseDropIds}
            dropIds={activeEventIds}
          />
        )}
      </Card>
      {activeEventIds.length > 0 && showActive &&
        <EventsCompare
          baseDropIds={baseDropIds}
          dropIds={activeEventIds}
          drops={drops}
          inCommon={inCommon}
          onClose={removeActiveDropId}
          dropsEnsNames={activeEventsEnsNames}
        />
      }
    </div>
  )
}

export default EventsInCommon
