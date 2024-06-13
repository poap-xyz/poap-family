import PropTypes from 'prop-types'
import { useMemo, useState } from 'react'
import { DropProps } from 'models/drop'
import {
  filterInCommon,
  INCOMMON_EVENTS_LIMIT,
  sortInCommonEntries,
} from 'models/in-common'
import ButtonLink from 'components/ButtonLink'
import Card from 'components/Card'
import ErrorMessage from 'components/ErrorMessage'
import EventsPowers from 'components/EventsPowers'
import EventsCompare from 'components/EventsCompare'
import EventsNavigateButtons from 'components/EventsNavigateButtons'
import ButtonClose from 'components/ButtonClose'
import 'styles/in-common.css'

/**
 * @param {PropTypes.InferProps<InCommon.propTypes>} props
 */
function InCommon({
  children,
  inCommon: initialInCommon = {},
  events = {},
  showCount,
  showActive = true,
  baseEventIds = [],
  createActiveTopButtons =
    /**
     * @param {number} eventId
     * @returns {import('react').ReactNode}
     */
    (eventId) => null,
}) {
  /**
   * @type {ReturnType<typeof useState<boolean>>}
   */
  const [showAll, setShowAll] = useState(false)
  /**
   * @type {ReturnType<typeof useState<number[]>>}
   */
  const [activeEventIds, setActiveEventIds] = useState([])

  const inCommonEntries = useMemo(() =>
    sortInCommonEntries(
      Object
        .entries(filterInCommon(initialInCommon))
        .map(([rawEventId, addresses]) => [parseInt(rawEventId), addresses])
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
        return INCOMMON_EVENTS_LIMIT
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

  const inCommonEventsAddresses = useMemo(
    () => {
      if (!showAll && inCommonEntries.length > inCommonLimit) {
        return inCommonEntries.slice(0, inCommonLimit)
      }
      return inCommonEntries.slice()
    },
    [inCommonEntries, inCommonLimit, showAll]
  )

  const powers = useMemo(
    () => inCommonEventsAddresses.map(([eventId, addresses]) => ({
      eventId,
      power: addresses.length,
    })),
    [inCommonEventsAddresses]
  )

  /**
   * @param {number} eventId
   */
  const removeActiveEventId = (eventId) => {
    setActiveEventIds((prevActiveEventIds) => {
      if (prevActiveEventIds == null) {
        return []
      }
      const newActiveEventIds = []
      for (const activeEventId of prevActiveEventIds) {
        if (activeEventId !== eventId) {
          newActiveEventIds.push(activeEventId)
        }
      }
      return newActiveEventIds
    })
  }

  /**
   * @param {number} eventId
   */
  const toggleActiveEventId = (eventId) => {
    if (activeEventIds.indexOf(eventId) === -1) {
      setActiveEventIds((prevActiveEventIds) => ([
        ...(prevActiveEventIds ?? []),
        eventId,
      ]))
    } else {
      removeActiveEventId(eventId)
    }
  }

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
          selectedEventIds={activeEventIds}
          onSelect={toggleActiveEventId}
          events={events}
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
            baseEventIds={baseEventIds}
            eventIds={activeEventIds}
          />
        )}
      </Card>
      {activeEventIds.length > 0 && showActive &&
        <EventsCompare
          baseEventIds={baseEventIds}
          eventIds={activeEventIds}
          events={events}
          inCommon={inCommon}
          createHeaderActions={
            /**
             * @param {number} eventId
             */
            (eventId) => (
              <>
                {createActiveTopButtons != null &&
                  createActiveTopButtons(eventId)}
                <ButtonClose
                  key="del"
                  onClose={() => removeActiveEventId(eventId)}
                />
              </>
            )
          }
        />
      }
    </div>
  )
}

InCommon.propTypes = {
  children: PropTypes.node,
  inCommon: PropTypes.objectOf(
    PropTypes.arrayOf(
      PropTypes.string.isRequired
    ).isRequired
  ).isRequired,
  events: PropTypes.objectOf(
    PropTypes.shape(DropProps).isRequired
  ).isRequired,
  showCount: PropTypes.number,
  showActive: PropTypes.bool,
  baseEventIds: PropTypes.arrayOf(PropTypes.number.isRequired),
  createActiveTopButtons: PropTypes.func,
}

export default InCommon
