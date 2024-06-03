import { useContext, useEffect, useMemo } from 'react'
import { useLoaderData, useNavigate, useSearchParams } from 'react-router-dom'
import { formatStat } from 'utils/number'
import { formatDateAgo } from 'utils/date'
import { HTMLContext } from 'stores/html'
import { useSettings } from 'stores/settings'
import { ReverseEnsContext } from 'stores/ethereum'
import { parseEventIds } from 'models/event'
import { DropData } from 'models/drop'
import { POAP_MOMENTS_URL } from 'models/poap'
import useEventInCommon from 'hooks/useEventInCommon'
import useEventsCollections from 'hooks/useEventsCollections'
import Timestamp from 'components/Timestamp'
import Page from 'components/Page'
import Card from 'components/Card'
import Button from 'components/Button'
import Loading from 'components/Loading'
import InCommon from 'components/InCommon'
import EventInfo from 'components/EventInfo'
import CollectionSet from 'components/CollectionSet'
import AddressErrorList from 'components/AddressErrorList'
import WarningMessage from 'components/WarningMessage'
import ErrorMessage from 'components/ErrorMessage'
import ButtonLink from 'components/ButtonLink'
import Progress from 'components/Progress'
import ButtonExportAddressCsv from 'components/ButtonExportAddressCsv'
import ButtonAdd from 'components/ButtonAdd'
import EventButtonGroup from 'components/EventButtonGroup'
import EventButtonMoments from 'components/EventButtonMoments'
import EventCompareButtons from 'components/EventCompareButtons'
import 'styles/event.css'

function Event() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { setTitle } = useContext(HTMLContext)
  const { settings } = useSettings()
  const { resolveEnsNames } = useContext(ReverseEnsContext)
  const loaderData = useLoaderData()

  const force = searchParams.get('force') === 'true'

  const { event, owners, ts, metrics } = useMemo(
    () => DropData(
      loaderData,
      /*includeDescription*/true,
      /*includeMetrics*/true,
    ),
    [loaderData]
  )

  const {
    completedEventInCommon,
    loadingEventInCommon,
    loadedInCommonProgress,
    loadedOwners,
    ownersErrors,
    inCommon,
    events,
    cachedTs,
    caching,
    cachingError,
    fetchEventInCommon,
    retryAddress,
  } = useEventInCommon(event.id, owners, force)

  const {
    loadingCollections,
    collectionsError,
    collections,
    fetchEventsCollections,
  } = useEventsCollections(
    useMemo(
      () => [event.id],
      [event]
    )
  )

  useEffect(
    () => {
      resolveEnsNames(owners)
    },
    [owners, resolveEnsNames]
  )

  useEffect(
    () => {
      const cancelEventInCommon = fetchEventInCommon()
      return () => {
        cancelEventInCommon()
      }
    },
    [fetchEventInCommon]
  )

  useEffect(
    () => {
      setTitle(event.name)
    },
    [event.name, setTitle]
  )

  useEffect(
    () => {
      let cancelEventsCollections
      if (
        metrics &&
        metrics.collectionsIncludes > 0 &&
        completedEventInCommon
      ) {
        cancelEventsCollections = fetchEventsCollections()
      }
      return () => {
        if (cancelEventsCollections) {
          cancelEventsCollections()
        }
      }
    },
    [
      metrics,
      completedEventInCommon,
      fetchEventsCollections,
    ]
  )

  const refreshCache = () => {
    setSearchParams({ force: 'true' })
  }

  /**
   * @param {number} eventId
   */
  const addEvent = (eventId) => {
    navigate(`/events/${parseEventIds(`${event.id},${eventId}`).join(',')}`)
  }

  /**
   * @param {number[]} eventIds
   */
  const addEvents = (eventIds) => {
    if (eventIds.length === 0) {
      return
    }
    navigate(`/events/${parseEventIds(`${event.id},${eventIds.join(',')}`).join(',')}`)
  }

  /**
   * @param {number[]} eventIds
   */
  const openEvents = (eventIds) => {
    if (eventIds.length === 0) {
      return
    }
    const newEventIds = parseEventIds(eventIds.join(','))
    if (newEventIds.length > 1) {
      navigate(`/events/${newEventIds.join(',')}`)
    } else if (newEventIds.length === 1) {
      navigate(`/event/${newEventIds[0]}`)
    }
  }

  const stats = useMemo(
    () => {
      const stats = {
        'collectors': metrics && metrics.emailReservations > 0
          ? {
              text: formatStat(owners.length + metrics.emailReservations),
            }
          : {
              text: formatStat(owners.length),
              title: ts != null ? `Cached ${formatDateAgo(ts)}` : undefined,
            },
      }

      if (metrics && metrics.emailReservations > 0) {
        stats['mints'] = {
          text: formatStat(owners.length),
          title: ts != null ? `Cached ${formatDateAgo(ts)}` : undefined,
        }
        stats['reservations'] = {
          text: formatStat(metrics.emailReservations),
          title: metrics.ts ? `Cached ${formatDateAgo(metrics.ts)}` : undefined,
        }
      }

      if (metrics && metrics.emailClaims > 0 && metrics.emailClaimsMinted > 0) {
        stats['email conversion'] = {
          text: formatStat(metrics.emailClaimsMinted),
          title: `${Math.trunc(metrics.emailClaimsMinted * 100 / metrics.emailClaims)}% of ${metrics.emailClaims} email claims`,
        }
      }

      if (metrics && metrics.collectionsIncludes > 0) {
        stats['collections'] = {
          text: formatStat(metrics.collectionsIncludes),
        }
      }

      if (metrics && metrics.momentsUploaded > 0) {
        stats['moments'] = {
          text: formatStat(metrics.momentsUploaded),
          title: `View uploaded moments on ${event.name}`,
          href: `${POAP_MOMENTS_URL}/drop/${event.id}`,
          external: true,
        }
      }

      return stats
    },
    [event, owners.length, ts, metrics]
  )

  return (
    <Page>
      <div className="event">
        <div className="event-header-info">
          <EventInfo
            event={event}
            stats={stats}
            highlightStat="collectors"
          >
            <EventButtonGroup event={event} viewInGallery={true}>
              <ButtonExportAddressCsv
                filename={`collectors-${event.id}`}
                name={event.name}
                addresses={owners}
                title={
                  `Generates CSV file with collectors of drop #${event.id}`
                }
              />
              <EventButtonMoments event={event} />
            </EventButtonGroup>
            {caching &&
              <div className="caching">
                Caching{' '}<Progress />
              </div>
            }
            {cachingError &&
              <div className="caching-error">
                <span className="caching-error-label">Error</span>
                {cachingError.cause
                  ? (
                      <span title={`${cachingError.cause}`}>
                        {cachingError.message}
                      </span>
                    )
                  : cachingError.message
                }
              </div>
            }
            {cachedTs && !caching &&
              <div className="cached">
                Cached <Timestamp ts={cachedTs} />,{' '}
                <ButtonLink onClick={() => refreshCache()}>refresh</ButtonLink>.
              </div>
            }
            {!cachedTs && !caching && metrics && metrics.ts &&
              <div className="cached">
                Cached <Timestamp ts={metrics.ts} />,{' '}
                <ButtonLink onClick={() => refreshCache()}>refresh</ButtonLink>.
              </div>
            }
          </EventInfo>
        </div>
        {loadingEventInCommon && (
          <Card>
            {loadedOwners > 0
              ? <Loading count={loadedOwners} total={owners.length} />
              : (
                loadedInCommonProgress != null
                  ? (
                      <Loading
                        progress={loadedInCommonProgress.progress}
                        eta={loadedInCommonProgress.estimated}
                        rate={loadedInCommonProgress.rate}
                      />
                    )
                  : <Loading />
              )
            }
            <AddressErrorList errors={ownersErrors} onRetry={retryAddress} />
          </Card>
        )}
        {!loadingEventInCommon && (
          <>
            {(
              cachedTs &&
              (
                !ts ||
                ts > cachedTs
              ) &&
              event.id in inCommon &&
              inCommon[event.id].length !== owners.length
            ) && (
              <WarningMessage>
                There have been new mints since this POAP was cached,{' '}
                <ButtonLink onClick={() => refreshCache()}>refresh</ButtonLink>.
              </WarningMessage>
            )}
            {ownersErrors.length > 0 && (
              <Card>
                <AddressErrorList
                  errors={ownersErrors}
                  onRetry={retryAddress}
                />
              </Card>
            )}
            {settings.showCollections && (
              <>
                {loadingCollections && collectionsError == null && (
                  <Card>
                    <h4>Collections</h4>
                    <Loading />
                  </Card>
                )}
                {!loadingCollections && collectionsError != null && (
                  <Card>
                    <h4>Collections</h4>
                    <ErrorMessage error={collectionsError} />
                  </Card>
                )}
                {(
                  !loadingCollections &&
                  collectionsError == null &&
                  collections != null
                ) && (
                  <CollectionSet
                    showEmpty={metrics && metrics.collectionsIncludes > 0}
                    emptyMessage={`No collections found that includes ${event.name}`}
                    collectionMap={{
                      [`${collections.length} collections`]: collections,
                    }}
                  />
                )}
              </>
            )}
            {loadedOwners === 0 && (
              <Card>
                <ErrorMessage message="No collectors" />
              </Card>
            )}
            {cachedTs && (
              <InCommon
                inCommon={inCommon}
                events={events}
                createButtons={(eventIds) => (Object.keys(events).length === 1 && String(Object.keys(events)[0]) === String(event.id) ? [] : [
                  <Button
                    key="add-all"
                    disabled={eventIds.length === 0 || (eventIds.length === 1 && String(eventIds[0]) === String(event.id))}
                    onClick={() => addEvents(eventIds)}
                  >
                    Add selected
                  </Button>,
                  <Button
                    key="open-all"
                    secondary={true}
                    disabled={eventIds.length === 0 || (eventIds.length === 1 && String(eventIds[0]) === String(event.id))}
                    onClick={() => openEvents(eventIds)}
                  >
                    Open
                  </Button>,
                ])}
                createActiveTopButtons={
                  /**
                   * @param {number} eventId
                   */
                  (eventId) => (
                    String(eventId) === String(event.id)
                      ? null
                      : (
                          <ButtonAdd
                            key="add"
                            onAdd={() => addEvent(eventId)}
                            title={`Combines drop #${eventId}`}
                          />
                        )
                  )
                }
                createActiveBottomButtons={
                  /**
                   * @param {number} eventId
                   */
                  (eventId) => (
                    <EventCompareButtons
                      eventId={eventId}
                      eventIds={[event.id]}
                      events={events}
                      inCommon={inCommon}
                    />
                  )
                }
              />
            )}
          </>
        )}
      </div>
    </Page>
  )
}

export default Event
