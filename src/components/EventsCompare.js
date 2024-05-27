import PropTypes from 'prop-types'
import { createRef, useEffect, useMemo, useState } from 'react'
import { useSettings } from 'stores/settings'
import { DropProps } from 'models/drop'
import {
  getAddressInCommonAddresses,
  getAddressInCommonEventIds,
} from 'models/in-common'
import { intersection } from 'utils/array'
import { getColorForSeed } from 'utils/color'
import Card from 'components/Card'
import EventHeader from 'components/EventHeader'
import AddressOwner from 'components/AddressOwner'
import EventButtonGroup from 'components/EventButtonGroup'
import 'styles/events-compare.css'

/**
 * @param {PropTypes.InferProps<EventsCompare.propTypes>} props
 */
function EventsCompare({
  eventIds,
  events,
  inCommon,
  createHeaderActions,
  createBottomButtons,
}) {
  const { settings } = useSettings()
  /**
   * @type {ReturnType<typeof useState<string | null>>}
   */
  const [highlighted, setHighlighted] = useState(null)
  /**
   * @type {ReturnType<typeof useState<Record<number, Record<string, ReturnType<typeof createRef<HTMLLIElement>>>>>>}
   */
  const [liRefs, setLiRefs] = useState({})

  const adressesColors = useMemo(
    () => eventIds.length < 2
      ? {}
      : Object.fromEntries(
        intersection(
          // @ts-ignore
          ...eventIds.map((eventId) => inCommon[eventId])
        )
        .map(
          (address) => [
            address,
            getColorForSeed(address),
          ]
        )
      ),
    [eventIds, inCommon]
  )

  useEffect(
    () => {
      if (eventIds.length > 0) {
        /**
         * @type {Record<number, Record<string, ReturnType<typeof createRef<HTMLLIElement>>>>}
         */
        const refs = {}
        for (const eventId of eventIds) {
          if (inCommon[eventId].length > 0) {
            refs[eventId] = {}
            for (const owner of inCommon[eventId]) {
              /**
               * @type {ReturnType<typeof createRef<HTMLLIElement>>}
               */
              const ref = createRef()
              refs[eventId][owner] = ref
            }
          }
        }
        if (Object.keys(refs).length > 0) {
          setLiRefs(refs)
        }
      }
    },
    [eventIds, inCommon]
  )

  /**
   * @param {number} ownerEventId
   * @param {string} owner
   */
  const onOwnerEnter = (ownerEventId, owner) => {
    if (
      owner in adressesColors &&
      settings &&
      settings.autoScrollCollectors
    ) {
      for (const eventId of eventIds) {
        if (
          eventId !== ownerEventId &&
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
        ownerEventId in liRefs &&
        owner in liRefs[ownerEventId] &&
        liRefs[ownerEventId][owner].current
      ) {
        liRefs[ownerEventId][owner].current.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        })
      }
    }
    setHighlighted((current) => (
      current !== owner &&
      owner in adressesColors
        ? owner
        : current
    ))
  }

  /**
   * @param {number} ownerEventId
   * @param {string} owner
   */
  const onOwnerLeave = (ownerEventId, owner) => {
    setHighlighted((current) => (
      current === owner &&
      owner in adressesColors
        ? null
        : current
    ))
  }

  return (
    <div className="events-compare">
      {eventIds.map((eventId) =>
        <div className="event-compare" key={eventId}>
          <Card>
            <EventHeader event={events[eventId]} size={48} />
            {createHeaderActions != null && (
              <div className="event-compare-actions">
                {createHeaderActions(eventId)}
              </div>
            )}
            <h4>
              {inCommon[eventId].length}{' '}
              collector{inCommon[eventId].length === 1 ? '' : 's'}
              {' '}in common
            </h4>
            <div className="event-compare-owners">
              <ul className="owners">
                {inCommon[eventId].map((owner) => {
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
                        eventId in liRefs &&
                        owner in liRefs[eventId]
                          ? liRefs[eventId][owner]
                          : undefined}
                      style={{
                        backgroundColor:
                          owner in adressesColors &&
                          (
                            !highlighted ||
                            highlighted === owner
                          )
                            ? adressesColors[owner]
                            : undefined,
                      }}
                      onMouseEnter={() => {
                        onOwnerEnter(eventId, owner)
                      }}
                      onMouseLeave={() => {
                        onOwnerLeave(eventId, owner)
                      }}
                    >
                      <AddressOwner
                        address={owner}
                        events={events}
                        inCommonEventIds={inCommonEventIds}
                        inCommonAddresses={inCommonAddresses}
                        linkToScan={
                          !highlighted || highlighted === owner}
                      />
                    </li>
                  )
                })}
              </ul>
            </div>
            <EventButtonGroup
              event={events[eventId]}
              viewInGallery={true}
            >
              {createBottomButtons != null &&
                createBottomButtons(eventId)}
            </EventButtonGroup>
          </Card>
        </div>
      )}
    </div>
  )
}

EventsCompare.propTypes = {
  eventIds: PropTypes.arrayOf(PropTypes.number.isRequired).isRequired,
  events: PropTypes.objectOf(
    PropTypes.shape(DropProps).isRequired
  ).isRequired,
  inCommon: PropTypes.objectOf(
    PropTypes.arrayOf(
      PropTypes.string.isRequired
    ).isRequired
  ).isRequired,
  createHeaderActions: PropTypes.func,
  createBottomButtons: PropTypes.func,
}

export default EventsCompare
