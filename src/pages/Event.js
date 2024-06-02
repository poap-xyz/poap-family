import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useLoaderData, useNavigate, useSearchParams } from 'react-router-dom'
import { formatStat } from 'utils/number'
import { formatDateAgo } from 'utils/date'
import { HTMLContext } from 'stores/html'
import { useSettings } from 'stores/settings'
import { ReverseEnsContext } from 'stores/ethereum'
import { scanAddress } from 'loaders/poap'
import { getInCommonEventsWithProgress, putEventInCommon } from 'loaders/api'
import { findEventsCollections } from 'loaders/collection'
import { parseEventIds } from 'models/event'
import { DropData } from 'models/drop'
import { filterInCommon } from 'models/in-common'
import { POAP_MOMENTS_URL } from 'models/poap'
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
  /**
   * @type {ReturnType<typeof useState<number | null>>}
   */
  const [cachedTs, setCachedTs] = useState(null)
  /**
   * @type {ReturnType<typeof useState<Record<number, string[]>>>}
   */
  const [inCommon, setInCommon] = useState({})
  /**
   * @type {ReturnType<typeof useState<Record<number, { id: number; name: string; description?: string; image_url: string; original_url: string; city: string | null; country: string | null; start_date: string; end_date: string; expiry_date: string }>>>}
   */
  const [events, setEvents] = useState({})
  /**
   * @type {ReturnType<typeof useState<Awaited<ReturnType<typeof findEventsCollections>> | null>>}
   */
  const [collectionData, setCollectionData] = useState(null)
  /**
   * @type {ReturnType<typeof useState<boolean>>}
   */
  const [loading, setLoading] = useState(false)
  /**
   * @type {ReturnType<typeof useState<number>>}
   */
  const [loadedCount, setLoadedCount] = useState(0)
  /**
   * @type {ReturnType<typeof useState<{ progress: number; estimated: number | null; rate: number | null; } | null>>}
   */
  const [loadedProgress, setLoadedProgress] = useState(null)
  /**
   * @type {ReturnType<typeof useState<boolean>>}
   */
  const [loadingCollections, setLoadingCollections] = useState(false)
  /**
   * @type {ReturnType<typeof useState<Array<{ address: string; error: Error }>>>}
   */
  const [errors, setErrors] = useState([])
  /**
   * @type {ReturnType<typeof useState<boolean>>}
   */
  const [caching, setCaching] = useState(false)
  /**
   * @type {ReturnType<typeof useState<Error | null>>}
   */
  const [cachingError, setCachingError] = useState(null)
  /**
   * @type {ReturnType<typeof useState<Error | null>>}
   */
  const [collectionsError, setCollectionsError] = useState(null)

  const { event, owners, ts, metrics } = useMemo(
    () => DropData(
      loaderData,
      /*includeDescription*/true,
      /*includeMetrics*/true,
    ),
    [loaderData]
  )

  const processAddress = useCallback(
    /**
     * @param {string} address
     * @param {AbortSignal} [abortSignal]
     */
    (address, abortSignal) => scanAddress(address, abortSignal).then(
      (ownerTokens) => {
        for (const ownerToken of ownerTokens) {
          const event = ownerToken.event
          if (event != null) {
            const eventId = event.id
            setInCommon((prevInCommon) => {
              if (prevInCommon == null) {
                return {
                  [eventId]: [address],
                }
              }
              if (eventId in prevInCommon) {
                if (prevInCommon[eventId].indexOf(address) === -1) {
                  prevInCommon[eventId].push(address)
                }
              } else {
                prevInCommon[eventId] = [address]
              }
              return prevInCommon
            })
            setEvents((prevEvents) => ({ ...prevEvents, [eventId]: event }))
          } else {
            setErrors((prevErrors) => ([
              ...(prevErrors ?? []),
              {
                address,
                error: new Error(`Could not find POAP ${ownerToken.id}`),
              },
            ]))
          }
        }
        setLoadedCount((prevLoadedCount) => (prevLoadedCount ?? 0) + 1)
      },
      (err) => {
        setErrors((prevErrors) => ([
          ...(prevErrors ?? []),
          { address, error: err },
        ]))
      }
    ),
    []
  )

  const process = useCallback(
    /**
     * @returns {AbortController[]}
     */
    () => {
      /**
       * @type {AbortController[]}
       */
      const controllers = []
      /**
       * @type {string[]}
       */
      const processedOwners = []
      setLoading(true)
      setErrors([])
      let promise = new Promise((r) => { r(undefined) })
      for (const owner of owners) {
        if (processedOwners.indexOf(owner) !== -1) {
          continue
        }
        const controller = new AbortController()
        promise = promise.then(
          () => processAddress(owner, controller.signal),
          () => processAddress(owner, controller.signal)
        )
        controllers.push(controller)
        processedOwners.push(owner)
      }
      promise.then(() => {
        setLoading(false)
      })
      return controllers
    },
    [owners, processAddress]
  )

  useEffect(
    () => {
      if (loadedCount === owners.length && !cachedTs) {
        const inCommonProcessed = filterInCommon(inCommon)
        const inCommonProcessedEventIds = Object
          .keys(inCommonProcessed)
          .map((rawEventId) => parseInt(rawEventId))
        if (inCommonProcessedEventIds.length > 0) {
          setCaching(true)
          setCachingError(null)
          putEventInCommon(event.id, inCommonProcessed).then(
            () => {
              setCaching(false)
              setCachedTs(Math.trunc(Date.now() / 1000))
            },
            (err) => {
              console.error(err)
              setCaching(false)
              setCachingError(new Error('Could not cache drop', { cause: err }))
            }
          )
        }
      }
    },
    [settings, event, owners, loadedCount, cachedTs, inCommon, events]
  )

  useEffect(
    () => {
      resolveEnsNames(owners)
      /**
       * @type {AbortController[]}
       */
      let controllers = []
      if (searchParams.get('force') === 'true') {
        controllers = process()
      } else {
        setLoading(true)
        setLoadedCount(0)
        setLoadedProgress(null)
        getInCommonEventsWithProgress(
          event.id,
          /*abortSignal*/undefined,
          /*onProgress*/({ progress, estimated, rate }) => {
            if (progress != null) {
              setLoadedProgress({
                progress,
                estimated: estimated ?? null,
                rate: rate ?? null,
              })
            } else {
              setLoadedProgress(null)
            }
          }
        ).then(
          (result) => {
            setLoadedProgress(null)
            if (!result) {
              controllers = process()
            } else {
              setEvents(result.events)
              setCachedTs(result.ts)
              setInCommon(result.inCommon)
              if (event.id in result.inCommon) {
                setLoadedCount(result.inCommon[event.id].length)
              }
              setCollectionData(null)
              setLoading(false)
            }
          },
          (err) => {
            setLoadedProgress(null)
            console.error(err)
            controllers = process()
          }
        )
      }
      return () => {
        for (const request of controllers) {
          request.abort()
        }
      }
    },
    [] // eslint-disable-line react-hooks/exhaustive-deps
  )

  useEffect(
    () => {
      setTitle(event.name)
    },
    [event.name, setTitle]
  )

  const loadCollections = useCallback(
    () => {
      if (!metrics || metrics.collectionsIncludes === 0) {
        return
      }
      setLoadingCollections(true)
      findEventsCollections([event.id]).then((eventCollectionsData) => {
        setCollectionData(eventCollectionsData)
        setLoadingCollections(false)
      }).catch((err) => {
        setCollectionsError(new Error('Could not load collections', {
          cause: err,
        }))
        setLoadingCollections(false)
      })
    },
    [metrics, event.id]
  )

  useEffect(
    () => {
      if (
        settings.showCollections &&
        !loading &&
        Object.keys(events).length > 0
      ) {
        loadCollections()
      }
    },
    [
      settings.showCollections,
      loading,
      events,
      loadCollections,
    ]
  )

  /**
   * @param {string} address
   */
  const retryAddress = (address) => {
    setErrors((prevErrors) => {
      if (prevErrors == null) {
        return []
      }
      const newErrors = []
      for (const { error, address: errorAddress } of prevErrors) {
        if (errorAddress !== address) {
          newErrors.push({ error, address: errorAddress })
        }
      }
      return newErrors
    })
    processAddress(address)
  }

  const refreshCache = () => {
    setSearchParams({ force: 'true' })
    setCachedTs(null)
    setEvents({})
    setInCommon({})
    setLoadedCount(0)
    setCollectionData(null)
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
        {loading
          ?
            <Card>
              {loadedCount > 0
                ? <Loading count={loadedCount} total={owners.length} />
                : (loadedProgress
                  ? <Loading
                      progress={loadedProgress.progress}
                      eta={loadedProgress.estimated}
                      rate={loadedProgress.rate}
                    />
                  : <Loading />
                )
              }
              <AddressErrorList errors={errors} onRetry={retryAddress} />
            </Card>
          :
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
              {errors.length > 0 && (
                <Card>
                  <AddressErrorList errors={errors} onRetry={retryAddress} />
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
                    collectionData != null
                  ) && (
                    <CollectionSet
                      showEmpty={metrics && metrics.collectionsIncludes > 0}
                      emptyMessage={`No collections found that includes ${event.name}`}
                      collectionMap={{
                        [`${collectionData.collections.length} collections`]: collectionData.collections,
                      }}
                    />
                  )}
                </>
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
        }
      </div>
    </Page>
  )
}

export default Event
