import { useContext, useEffect, useMemo, useState } from 'react'
import { Link, useLoaderData, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { formatStat } from 'utils/number'
import { HTMLContext } from 'stores/html'
import { ReverseEnsContext } from 'stores/ethereum'
import { mergeAllInCommon } from 'models/in-common'
import { parseEventIds } from 'models/event'
import { Drop, parseDrops } from 'models/drop'
import { EnsByAddress } from 'models/ethereum'
import { InCommon } from 'models/api'
import { union, uniq } from 'utils/array'
import { formatDate } from 'utils/date'
import useEventsOwnersAndMetrics from 'hooks/useEventsOwnersAndMetrics'
import useEventsInCommon from 'hooks/useEventsInCommon'
import useEventsCollections from 'hooks/useEventsCollections'
import Timestamp from 'components/Timestamp'
import Card from 'components/Card'
import EventButtonGroup from 'components/EventButtonGroup'
import Page from 'components/Page'
import TokenImageZoom from 'components/TokenImageZoom'
import Status from 'components/Status'
import Loading from 'components/Loading'
import ShadowText from 'components/ShadowText'
import ButtonLink from 'components/ButtonLink'
import Progress from 'components/Progress'
import EventsInCommon from 'components/EventsInCommon'
import CollectionSet from 'components/CollectionSet'
import EventsOwners from 'components/EventsOwners'
import Switch from 'components/Switch'
import WarningIcon from 'components/WarningIcon'
import WarningMessage from 'components/WarningMessage'
import ErrorMessage from 'components/ErrorMessage'
import ButtonDelete from 'components/ButtonDelete'
import 'styles/events.css'

function Events() {
  const navigate = useNavigate()
  const { eventIds: rawEventIds } = useParams()
  const [searchParams, setSearchParams] = useSearchParams({ all: 'false' })
  const { setTitle } = useContext(HTMLContext)
  const { resolveEnsNames } = useContext(ReverseEnsContext)
  const loaderData = useLoaderData()
  const [eventsEnsNames, setEventsEnsNames] = useState<Record<number, EnsByAddress>>({})

  const force = searchParams.get('force') === 'true'
  const all = searchParams.get('all') === 'true'

  const drops = useMemo(
    () => parseDrops(loaderData, /*includeDescription*/false),
    [loaderData]
  )

  const eventIds = useMemo(
    () => Object.keys(drops).map((rawEventId) => parseInt(rawEventId)),
    [drops]
  )

  const {
    completedEventsOwnersAndMetrics,
    loadingEventsOwnersAndMetrics,
    loadingOwnersAndMetricsEvents,
    eventsOwnersAndMetricsErrors,
    eventsOwners,
    eventsMetrics,
    fetchEventsOwnersAndMetrics,
    retryEventOwnersAndMetrics,
  } = useEventsOwnersAndMetrics(eventIds)

  const {
    completedEventsInCommon,
    completedInCommonEvents,
    loadingInCommonEvents,
    eventsInCommonErrors,
    loadedEventsInCommon,
    loadedEventsInCommonEvents,
    loadedEventsProgress,
    loadedEventsOwners,
    eventsInCommon,
    fetchEventsInCommon,
    retryEventAddressInCommon,
  } = useEventsInCommon(
    eventIds,
    eventsOwners,
    all,
    /*refresh*/force,
    /*local*/false,
    /*stream*/true
  )

  const {
    loadingCollections,
    collectionsError,
    collections,
    relatedCollections,
    fetchEventsCollections,
  } = useEventsCollections(eventIds)

  useEffect(
    () => {
      setTitle(Object.values(drops).map((event) => event.name).join(', '))
    },
    [drops, setTitle]
  )

  useEffect(
    () => {
      resolveEnsNames(
        uniq(union(...Object.values(eventsOwners)))
      )
    },
    [eventsOwners, resolveEnsNames]
  )

  useEffect(
    () => {
      const cancelEventsOwnersAndMetrics = fetchEventsOwnersAndMetrics()
      return () => {
        cancelEventsOwnersAndMetrics()
      }
    },
    [fetchEventsOwnersAndMetrics]
  )

  useEffect(
    () => {
      let cancelEventsInCommon: () => void | undefined
      if (completedEventsOwnersAndMetrics) {
        cancelEventsInCommon = fetchEventsInCommon()
      }
      return () => {
        if (cancelEventsInCommon) {
          cancelEventsInCommon()
        }
      }
    },
    [completedEventsOwnersAndMetrics, fetchEventsInCommon]
  )

  useEffect(
    () => {
      let cancelEventsCollections: () => void | undefined
      if (completedEventsInCommon) {
        cancelEventsCollections = fetchEventsCollections()
      }
      return () => {
        if (cancelEventsCollections) {
          cancelEventsCollections()
        }
      }
    },
    [
      completedEventsInCommon,
      fetchEventsCollections,
    ]
  )

  function delEvent(eventId: number): void {
    const newEventIds = parseEventIds(String(rawEventIds)).filter(
      (paramEventId) => String(paramEventId) !== String(eventId)
    )
    if (newEventIds.length === 1) {
      navigate(`/event/${newEventIds[0]}`)
    } else if (newEventIds.length > 0) {
      navigate(`/events/${newEventIds.join(',')}`)
    } else {
      navigate('/')
    }
  }

  function handleAllChange(checked: boolean): void {
    setSearchParams({ all: checked ? 'true' : 'false' })
  }

  function handleViewAll(): void {
    setSearchParams({ all: 'true' })
  }

  const inCommon: InCommon = useMemo(
    () => {
      if (!completedEventsInCommon) {
        return {}
      }
      return mergeAllInCommon(
        Object.values(eventsInCommon).map(
          (oneEventData) => oneEventData?.inCommon ?? {}
        ),
        all
      )
    },
    [completedEventsInCommon, eventsInCommon, all]
  )

  const allEvents: Record<number, Drop> = useMemo(
    () => Object.values(eventsInCommon).reduce(
      (allEvents, data) => ({
        ...allEvents,
        ...data.events,
      }),
      {}
    ),
    [eventsInCommon]
  )

  const staleEvents = useMemo(
    () => {
      if (!completedEventsInCommon) {
        return 0
      }
      return eventIds.reduce(
        (total, eventId) => {
          if (
            loadedEventsOwners[eventId] == null ||
            eventsOwners[eventId] == null ||
            eventsInCommon[eventId] == null ||
            eventsInCommon[eventId].inCommon[eventId] == null ||
            (
              loadedEventsOwners[eventId] !== eventsOwners[eventId].length &&
              eventsInCommon[eventId].inCommon[eventId].length !== eventsOwners[eventId].length
            )
          ) {
            return total + 1
          }
          return total
        },
        0
      )
    },
    [
      eventIds,
      eventsOwners,
      completedEventsInCommon,
      loadedEventsOwners,
      eventsInCommon,
    ]
  )

  function refreshCache(): void {
    setSearchParams({ force: 'true' })
  }

  function sumCollectionsIncludes(): number {
    if (typeof eventsMetrics !== 'object') {
      return 0
    }
    return Object.values(eventsMetrics).reduce(
      (total, metric) => total + metric.collectionsIncludes,
      0
    )
  }

  function handleEventActive(eventId: number): void {
    const addresses = inCommon[eventId]
    if (addresses != null && addresses.length > 0) {
      resolveEnsNames(addresses).then((ensNames) => {
        setEventsEnsNames((prevEventsEnsNames) => ({
          ...prevEventsEnsNames,
          [eventId]: ensNames,
        }))
      })
    }
  }

  return (
    <Page>
      <div className="events">
        <div className="events-table">
          <Card>
            <table>
              <thead>
                <tr>
                  <th className="event-head" align="left">Drop</th>
                  <th>Collectors</th>
                  <th></th>
                  <th></th>
                  <th className="event-head-actions">
                    <span>In Common</span>
                    <Switch
                      id="all"
                      checked={all}
                      onChange={handleAllChange}
                      labelOn="X"
                      labelOff="X"
                    />
                    <span>All</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {Object.values(drops).map((drop) => (
                  <tr key={drop.id}>
                    <td className="event-cell-info">
                      <div className="event-image">
                        <TokenImageZoom
                          event={drop}
                          zoomSize={512}
                          size={48}
                        />
                        <Link
                          to={`/event/${drop.id}`}
                          className="event-id"
                        >
                          #{drop.id}
                        </Link>
                      </div>
                      <div className="event-data">
                        <h2>{drop.name}</h2>
                        <div className="event-date">
                          {formatDate(drop.start_date)}
                        </div>
                        {drop.city && drop.country && (
                          <div className="place">
                            {drop.city}, {drop.country}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="event-cell-metrics">
                      {(
                        loadingEventsOwnersAndMetrics ||
                        loadingOwnersAndMetricsEvents[drop.id] != null
                      ) && (
                        <Loading small={true} />
                      )}
                      {eventsOwners[drop.id] != null && (
                        <ShadowText grow={true} medium={true}>
                          {formatStat(eventsOwners[drop.id].length)}
                          {(
                            eventsMetrics[drop.id] != null &&
                            eventsMetrics[drop.id].emailReservations > 0
                          ) && (
                            ` + ${formatStat(eventsMetrics[drop.id].emailReservations)}`
                          )}
                        </ShadowText>
                      )}
                    </td>
                    <td className="event-cell-status">
                      <Status
                        loading={
                          loadingInCommonEvents[drop.id]
                        }
                        error={
                          eventsOwnersAndMetricsErrors[drop.id] != null ||
                          eventsInCommonErrors[drop.id] != null
                        }
                      />
                      {eventsOwnersAndMetricsErrors[drop.id] != null && (
                        <>
                          <span
                            className="status-error-message"
                            title={eventsOwnersAndMetricsErrors[drop.id].cause
                              ? `${eventsOwnersAndMetricsErrors[drop.id].cause}`
                              : undefined}
                          >
                            {eventsOwnersAndMetricsErrors[drop.id].message}
                          </span>
                          {' '}
                          <ButtonLink
                            onClick={() => retryEventOwnersAndMetrics(drop.id)}
                          >
                            retry
                          </ButtonLink>
                        </>
                      )}
                    </td>
                    <td className="event-cell-progress">
                      {(
                        loadingInCommonEvents[drop.id] != null &&
                        loadedEventsInCommon[drop.id] == null &&
                        loadedEventsInCommonEvents[drop.id] == null &&
                        loadedEventsProgress[drop.id] == null &&
                        loadedEventsOwners[drop.id] != null &&
                        eventsOwners[drop.id] != null
                      ) && (
                        <Progress
                          value={loadedEventsOwners[drop.id]}
                          max={eventsOwners[drop.id].length}
                          showValue={loadedEventsOwners[drop.id] > 0}
                        />
                      )}
                      {(
                        loadedEventsInCommon[drop.id] != null &&
                        loadedEventsInCommonEvents[drop.id] == null &&
                        loadedEventsProgress[drop.id] == null
                       ) && (
                        <Progress
                          value={loadedEventsInCommon[drop.id].count}
                          max={loadedEventsInCommon[drop.id].total}
                          maxFinal={loadedEventsInCommon[drop.id].totalFinal}
                          showValue={loadedEventsInCommon[drop.id].total > 0}
                        />
                      )}
                      {(
                        loadedEventsInCommon[drop.id] != null &&
                        loadedEventsInCommonEvents[drop.id] != null &&
                        loadedEventsProgress[drop.id] == null
                       ) && (
                        <Progress
                          value={loadedEventsInCommonEvents[drop.id].count}
                          max={loadedEventsInCommonEvents[drop.id].total}
                          showValue={loadedEventsInCommonEvents[drop.id].total > 0}
                        />
                      )}
                      {(
                        loadedEventsInCommon[drop.id] == null &&
                        loadedEventsInCommonEvents[drop.id] == null &&
                        loadedEventsProgress[drop.id] != null
                       ) && (
                        <Progress
                          value={loadedEventsProgress[drop.id].progress}
                          max={1}
                          showPercent={true}
                          eta={loadedEventsProgress[drop.id].estimated}
                          rate={loadedEventsProgress[drop.id].rate}
                        />
                      )}
                      {eventsInCommonErrors[drop.id] != null && Object.entries(
                        eventsInCommonErrors[drop.id]
                      ).map(
                        ([address, error]) => (
                          <p key={address} className="address-error-message">
                            <code>[{address}]</code>{' '}
                            <span
                              title={error.cause ? `${error.cause}` : undefined}
                            >
                              {error.message}
                            </span>{' '}
                            <ButtonLink
                              onClick={() => {
                                retryEventAddressInCommon(drop.id, address)
                              }}
                            >
                              retry
                            </ButtonLink>
                          </p>
                        )
                      )}
                      {(
                        eventsInCommon[drop.id] != null &&
                        eventsInCommon[drop.id].ts != null
                      ) && (
                        <p className="status-cached-ts">
                          Cached <Timestamp ts={eventsInCommon[drop.id].ts} />
                          {(
                            completedInCommonEvents[drop.id] &&
                            eventsOwners[drop.id] != null &&
                            eventsInCommon[drop.id] != null &&
                            eventsInCommon[drop.id].inCommon[drop.id] != null &&
                            eventsInCommon[drop.id].inCommon[drop.id].length !== eventsOwners[drop.id].length
                          ) && (
                            <>
                              {' '}
                              <WarningIcon
                                title="There have been new mints since this POAP was cached"
                              />
                            </>
                          )}
                        </p>
                      )}
                    </td>
                    <td className="event-cell-actions">
                      <EventButtonGroup
                        event={drop}
                        right={true}
                        viewInGallery={true}
                      >
                        <ButtonDelete
                          onDelete={() => delEvent(drop.id)}
                          title={`Removes drop #${drop.id}`}
                        />
                      </EventButtonGroup>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
        {staleEvents > 0 && (
          <WarningMessage>
            There have been new mints in {staleEvents}{' '}
            POAP{staleEvents === 1 ? '' : 's'} since cached,{' '}
            <ButtonLink onClick={() => refreshCache()}>refresh all</ButtonLink>.
          </WarningMessage>
        )}
        {!completedEventsOwnersAndMetrics && !completedEventsInCommon && (
          <Card shink={true}>
            <Loading title="Loading collectors and metrics" />
          </Card>
        )}
        {completedEventsOwnersAndMetrics && !completedEventsInCommon && (
          <Card shink={true}>
            <Loading
              title="Loading drops"
              count={Object.values(loadedEventsOwners).length}
              total={eventIds.length}
            />
          </Card>
        )}
        {completedEventsInCommon && (
          <>
            {loadingCollections && !collectionsError && (
              <Card>
                <h4>Collections</h4>
                <Loading />
              </Card>
            )}
            {!loadingCollections && collectionsError && (
              <Card>
                <h4>Collections</h4>
                <ErrorMessage error={collectionsError} />
              </Card>
            )}
            {(
              !loadingCollections &&
              !collectionsError &&
              collections != null &&
              relatedCollections != null
            ) && (
              <CollectionSet
                showEmpty={sumCollectionsIncludes() > 0}
                emptyMessage={(
                  <>
                    No collections found that includes exactly all{' '}
                    {Object.keys(drops).length} POAPs,{' '}
                    <ButtonLink onClick={handleViewAll}>
                      view related collections
                    </ButtonLink>.
                  </>
                )}
                collectionMap={{
                  [`${collections.length} collections`]: collections,
                  [`${relatedCollections.length} related collections`]: all ? relatedCollections : [],
                }}
              />
            )}
            <EventsOwners
              eventsOwners={eventsOwners}
              inCommon={inCommon}
              events={allEvents}
              all={all}
            />
            <EventsInCommon
              onActive={handleEventActive}
              inCommon={inCommon}
              events={allEvents}
              baseEventIds={eventIds}
              eventsEnsNames={eventsEnsNames}
            />
          </>
        )}
      </div>
    </Page>
  )
}

export default Events
