import PropTypes from 'prop-types'
import { createRef, useContext, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { clsx } from 'clsx'
import { SettingsContext } from '../stores/cache'
import { DropProps } from '../models/drop'
import { filterInCommon, getAddressInCommonAddresses, getAddressInCommonEventIds, INCOMMON_EVENTS_LIMIT, sortInCommonEntries } from '../models/in-common'
import { intersection } from '../utils/array'
import { getColorForSeed } from '../utils/color'
import ButtonLink from './ButtonLink'
import Card from './Card'
import EventHeader from './EventHeader'
import ErrorMessage from './ErrorMessage'
import EventCount from './EventCount'
import EventButtons from './EventButtons'
import AddressOwner from './AddressOwner'
import ButtonGroup from './ButtonGroup'
import TokenImage from './TokenImage'
import ButtonClose from './ButtonClose'
import '../styles/in-common.css'

/**
 * @param {PropTypes.InferProps<InCommon.propTypes>} props
 */
function InCommon({
  children,
  inCommon: initialInCommon = {},
  events = {},
  showCount = 0,
  showActive = true,
  createButtons =
    /**
     * @param {number[]} eventIds
     * @returns {import('react').ReactNode}
     */
    (eventIds) => [],
  createActiveTopButtons =
    /**
     * @param {number} eventId
     * @returns {import('react').ReactNode}
     */
    (eventId) => [],
  createActiveBottomButtons =
    /**
     * @param {number} eventId
     * @returns {import('react').ReactNode}
     */
    (eventId) => [],
}) {
  const { settings } = useContext(SettingsContext)
  /**
   * @type {ReturnType<typeof useState<boolean>>}
   */
  const [showAll, setShowAll] = useState(false)
  /**
   * @type {ReturnType<typeof useState<number[]>>}
   */
  const [activeEventIds, setActiveEventIds] = useState([])
  /**
   * @type {ReturnType<typeof useState<string | null>>}
   */
  const [ownerHighlighted, setOwnerHighlighted] = useState(null)
  /**
   * @type {ReturnType<typeof useState<Record<number, Record<string, ReturnType<typeof createRef<HTMLLIElement>>>>>>}
   */
  const [liRefs, setLiRefs] = useState({})

  const inCommonEntries = sortInCommonEntries(
    Object
      .entries(filterInCommon(initialInCommon))
      .map(([rawEventId, addresses]) => [parseInt(rawEventId), addresses])
  )

  const inCommon = Object.fromEntries(inCommonEntries)

  let inCommonEventsAddresses = inCommonEntries.slice()
  let inCommonLimit = INCOMMON_EVENTS_LIMIT

  if (showCount > 0) {
    inCommonLimit = inCommonEventsAddresses.reduce(
      (limit, [, addresses]) => {
        if (addresses.length === showCount) {
          return limit + 1
        }
        return limit
      },
      0
    )
  }

  const inCommonTotal = inCommonEventsAddresses.length
  const hasMore = inCommonTotal > inCommonLimit

  if (hasMore && !showAll) {
    inCommonEventsAddresses = inCommonEventsAddresses.slice(0, inCommonLimit)
  }

  /**
   * @param {number} eventId
   */
  const removeActiveEventId = (eventId) => {
    setActiveEventIds((prevActiveEventIds) => {
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
        ...prevActiveEventIds,
        eventId,
      ]))
    } else {
      removeActiveEventId(eventId)
    }
  }

  const activeAdressesColors = activeEventIds.length < 2 ? {} :
    Object.fromEntries(
      intersection(
        // @ts-ignore
        ...activeEventIds.map((activeEventId) => inCommon[activeEventId])
      )
      .map(
        (address) => [
          address,
          getColorForSeed(address),
        ]
      )
    )

  useEffect(
    () => {
      /**
       * @type {Record<number, Record<string, ReturnType<typeof createRef<HTMLLIElement>>>>}
       */
      const refs = {}
      for (const activeEventId of activeEventIds) {
        refs[activeEventId] = {}
        for (const owner of inCommon[activeEventId]) {
          /**
           * @type {ReturnType<typeof createRef<HTMLLIElement>>}
           */
          const ref = createRef()
          refs[activeEventId][owner] = ref
        }
      }
      setLiRefs(refs)
    },
    [activeEventIds, inCommon]
  )

  /**
   * @param {number} activeEventId
   * @param {string} owner
   */
  const onOwnerEnter = (activeEventId, owner) => {
    if (
      owner in activeAdressesColors &&
      settings &&
      settings.autoScrollCollectors
    ) {
      for (const eventId of activeEventIds) {
        if (
          eventId !== activeEventId &&
          eventId && liRefs &&
          owner in liRefs[eventId] &&
          liRefs[eventId][owner].current
        ) {
          liRefs[eventId][owner].current.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          })
        }
      }
      if (
        activeEventId in liRefs &&
        owner in liRefs[activeEventId] &&
        liRefs[activeEventId][owner].current
      ) {
        liRefs[activeEventId][owner].current.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        })
      }
    }
    setOwnerHighlighted((current) => (
      current !== owner &&
      owner in activeAdressesColors
        ? owner
        : current
    ))
  }

  const onOwnerLeave = (activeEventId, owner) => {
    setOwnerHighlighted((current) => (
      current === owner &&
      owner in activeAdressesColors
        ? null
        : current
    ))
  }

  return (
    <div className="in-common">
      <Card>
        {children}
        {inCommonTotal === 0 && (
          <ErrorMessage>
            <p>No POAPs in common</p>
          </ErrorMessage>
        )}
        {inCommonTotal > 0 && (
          <h4>
            {showCount > 0 && `${inCommonLimit} of `}
            {inCommonTotal}{' '}
            drop{inCommonTotal === 1 ? '' : 's'}{' '}
            in common
          </h4>
        )}
        <div className={clsx('in-common-events', showAll && 'show-all')}>
          {inCommonEventsAddresses.map(
            ([eventId, addresses]) => (
              <div
                key={eventId}
                className={clsx('in-common-event', {
                  selected: activeEventIds.indexOf(eventId) !== -1,
                  perfect: showCount > 0 && showCount === addresses.length,
                })}
                title={events[eventId].name}
              >
                <button
                  className="event-button"
                  onClick={() => toggleActiveEventId(eventId)}
                >
                  {showCount > 0 && showCount === addresses.length
                    ? (
                      <div className="event-image">
                        <TokenImage event={events[eventId]} size={64} />
                      </div>
                    )
                    : (
                      <EventCount
                        event={events[eventId]}
                        count={addresses.length}
                        size={64}
                      />
                    )
                  }
                </button>
                <Link
                  to={`/event/${eventId}`}
                  className="event-id"
                >
                  #{eventId}
                </Link>
              </div>
            )
          )}
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
        </div>
        {inCommonTotal > 0 && (
          <ButtonGroup right={true}>
            {createButtons(activeEventIds)}
          </ButtonGroup>
        )}
      </Card>
      {activeEventIds.length > 0 && showActive &&
        <div className="active-events">
          {activeEventIds.map((activeEventId) =>
            <div className="active-event" key={activeEventId}>
              <Card>
                <EventHeader event={events[activeEventId]} size={48} />
                <div className="active-event-actions">
                  {createActiveTopButtons(activeEventId)}
                  <ButtonClose
                    onClose={() => removeActiveEventId(activeEventId)}
                  />
                </div>
                <h4>
                  {inCommon[activeEventId].length}{' '}
                  collector{inCommon[activeEventId].length === 1 ? '' : 's'}
                  {' '}in common
                </h4>
                <div className="active-event-owners">
                  <ul className="owners">
                    {inCommon[activeEventId].map((owner) => {
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
                        <li
                          key={owner}
                          ref={
                            activeEventId in liRefs &&
                            owner in liRefs[activeEventId]
                              ? liRefs[activeEventId][owner]
                              : undefined}
                          style={{
                            backgroundColor: owner in activeAdressesColors &&
                              (!ownerHighlighted || ownerHighlighted === owner)
                                ? activeAdressesColors[owner]
                                : undefined,
                          }}
                          onMouseEnter={() => {
                            onOwnerEnter(activeEventId, owner)
                          }}
                          onMouseLeave={() => {
                            onOwnerLeave(activeEventId, owner)
                          }}
                        >
                          <AddressOwner
                            address={owner}
                            events={events}
                            inCommonEventIds={inCommonEventIds}
                            inCommonAddresses={inCommonAddresses}
                            linkToScan={
                              !ownerHighlighted || ownerHighlighted === owner}
                          />
                        </li>
                      )
                    })}
                  </ul>
                </div>
                <EventButtons
                  event={{ id: activeEventId }}
                  viewInGallery={true}
                  buttons={createActiveBottomButtons(activeEventId)}
                />
              </Card>
            </div>
          )}
        </div>
      }
    </div>
  )
}

InCommon.propTypes = {
  children: PropTypes.node,
  inCommon: PropTypes.objectOf(PropTypes.arrayOf(PropTypes.string)).isRequired,
  events: PropTypes.objectOf(PropTypes.shape(DropProps)).isRequired,
  showCount: PropTypes.number,
  showActive: PropTypes.bool,
  createButtons: PropTypes.func,
  createActiveTopButtons: PropTypes.func,
  createActiveBottomButtons: PropTypes.func,
}

export default InCommon
