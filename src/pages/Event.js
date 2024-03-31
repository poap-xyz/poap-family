import { useCallback, useContext, useEffect, useState } from 'react'
import { useLoaderData, useNavigate, useSearchParams } from 'react-router-dom'
import { Upload } from 'iconoir-react'
import { formatStat } from '../utils/number'
import { formatDateAgo } from '../utils/date'
import { HTMLContext } from '../stores/html'
import { SettingsContext } from '../stores/cache'
import { ReverseEnsContext } from '../stores/ethereum'
import { scanAddress } from '../loaders/poap'
import { getInCommonEventsWithProgress, putEventInCommon } from '../loaders/api'
import { findEventsCollections } from '../loaders/collection'
import { parseEventIds } from '../models/event'
import { filterAndSortInCommon } from '../models/in-common'
import { POAP_MOMENTS_URL } from '../models/poap'
import Timestamp from '../components/Timestamp'
import Page from '../components/Page'
import Card from '../components/Card'
import Button from '../components/Button'
import Loading from '../components/Loading'
import InCommon from '../components/InCommon'
import EventInfo from '../components/EventInfo'
import CollectionSet from '../components/CollectionSet'
import AddressErrorList from '../components/AddressErrorList'
import WarningMessage from '../components/WarningMessage'
import ErrorMessage from '../components/ErrorMessage'
import ButtonLink from '../components/ButtonLink'
import Progress from '../components/Progress'
import ButtonExportAddressCsv from '../components/ButtonExportAddressCsv'
import ButtonAdd from '../components/ButtonAdd'
import ButtonExpand from '../components/ButtonExpand'
import ButtonMenu from '../components/ButtonMenu'
import LinkButton from '../components/LinkButton'
import '../styles/event.css'

function Event() {
  const navigate = useNavigate()
  const { settings } = useContext(SettingsContext)
  const { resolveEnsNames } = useContext(ReverseEnsContext)
  const { event, owners, ts, metrics } = useLoaderData()
  const [searchParams, setSearchParams] = useSearchParams()
  const { setTitle } = useContext(HTMLContext)
  const [cachedTs, setCachedTs] = useState(null)
  const [inCommon, setInCommon] = useState({})
  const [events, setEvents] = useState({})
  const [collectionData, setCollectionData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadedCount, setLoadedCount] = useState(0)
  const [loadedProgress, setLoadedProgress] = useState(null)
  const [loadingCollections, setLoadingCollections] = useState(false)
  const [errors, setErrors] = useState([])
  const [caching, setCaching] = useState(false)
  const [cachingError, setCachingError] = useState(null)
  const [collectionsError, setCollectionsError] = useState(null)

  const processAddress = useCallback(
    (address, abortSignal) => scanAddress(address, abortSignal).then(
      (ownerTokens) => {
        for (const ownerToken of ownerTokens) {
          const eventId = ownerToken.event.id
          setInCommon((prevInCommon) => {
            if (eventId in prevInCommon) {
              if (prevInCommon[eventId].indexOf(address) === -1) {
                prevInCommon[eventId].push(address)
              }
            } else {
              prevInCommon[eventId] = [address]
            }
            return prevInCommon
          })
          setEvents((prevEvents) => ({ ...prevEvents, [eventId]: ownerToken.event }))
        }
        setLoadedCount((prevLoadedCount) => prevLoadedCount + 1)
      },
      (err) => {
        setErrors((prevErrors) => ([...prevErrors, { address, error: err }]))
      }
    ),
    []
  )

  const process = useCallback(
    () => {
      const controllers = []
      const processedOwners = []
      setLoading(true)
      setErrors([])
      let promise = new Promise((r) => { r() })
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
        const inCommonProcessed = Object.fromEntries(
          filterAndSortInCommon(
            Object.entries(inCommon)
          )
        )
        const inCommonProcessedEventIds = Object.keys(inCommonProcessed)
        if (inCommonProcessedEventIds.length > 0) {
          setCaching(true)
          setCachingError(null)
          putEventInCommon(event.id, inCommonProcessed).then(
            () => {
              setCaching(false)
              setCachedTs(Math.trunc(Date.now() / 1000))
            },
            (err) => {
              const error = new Error('Could not cache drop')
              error.reason = err
              console.error(err)
              setCaching(false)
              setCachingError(error)
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
      let requests = []
      if (searchParams.get('force') === 'true') {
        requests = process()
      } else {
        setLoading(true)
        setLoadedCount(0)
        setLoadedProgress(null)
        getInCommonEventsWithProgress(
          event.id,
          /*abortSignal*/undefined,
          /*onProgress*/({ loaded, total, progress, bytes, estimated, rate }) => {
            setLoadedProgress({ progress, estimated, rate })
          }
        ).then(
          (result) => {
            setLoadedProgress(null)
            if (!result) {
              requests = process()
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
            requests = process()
          }
        )
      }
      return () => {
        for (const request of requests) {
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
      setLoadingCollections(true)
      ;(
        metrics && metrics.collectionsIncludes > 0
          ? findEventsCollections([event.id])
          : Promise.resolve({
            collections: [],
            related: [],
          })
      ).then((eventCollectionsData) => {
        setCollectionData(eventCollectionsData)
        setLoadingCollections(false)
      }).catch((err) => {
        setCollectionsError(err?.message ?? 'Could not load collections')
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

  const retryAddress = (address) => {
    setErrors((prevErrors) => {
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
    setSearchParams({ force: true })
    setCachedTs(null)
    setEvents({})
    setInCommon({})
    setLoadedCount(0)
    setCollectionData(null)
  }

  const addEvent = (eventId) => {
    navigate(`/events/${parseEventIds(`${event.id},${eventId}`).join(',')}`)
  }

  const addEvents = (eventIds) => {
    if (eventIds.length === 0) {
      return
    }
    navigate(`/events/${parseEventIds(`${event.id},${eventIds.join(',')}`).join(',')}`)
  }

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

  return (
    <Page>
      <div className="event">
        <div className="event-header">
          <EventInfo
            event={event}
            stats={{
              'collectors': metrics && metrics.emailReservations > 0
                ? formatStat(owners.length + metrics.emailReservations)
                : (
                  ts === null
                    ? formatStat(owners.length)
                    : {
                      text: formatStat(owners.length),
                      title: `Cached ${formatDateAgo(ts)}`,
                    }
                ),
              'mints': !metrics || metrics.emailReservations === 0 ? undefined : (
                ts === null
                  ? formatStat(owners.length)
                  : {
                    text: formatStat(owners.length),
                    title: `Cached ${formatDateAgo(ts)}`,
                  }
              ),
              'reservations': metrics && metrics.emailReservations > 0
                ? {
                  text: formatStat(metrics.emailReservations),
                  title: metrics.ts ? `Cached ${formatDateAgo(metrics.ts)}` : undefined,
                }
                : undefined,
              'email conversion': metrics && metrics.emailClaims > 0 && metrics.emailClaimsMinted > 0
                ? {
                  text: formatStat(metrics.emailClaimsMinted),
                  title: `${Math.trunc(metrics.emailClaimsMinted * 100 / metrics.emailClaims)}% of ${metrics.emailClaims} email claims`,
                }
                : undefined,
              'collections': metrics && metrics.collectionsIncludes > 0
                ? formatStat(metrics.collectionsIncludes)
                : undefined,
              'moments': metrics && metrics.momentsUploaded > 0
                ? {
                  text: formatStat(metrics.momentsUploaded),
                  title: `View uploaded moments on ${event.name}`,
                  link: `${POAP_MOMENTS_URL}/drop/${event.id}`,
                  external: true,
                }
                : undefined,
            }}
            highlightStat="collectors"
            buttons={[
              <ButtonExportAddressCsv
                key="export-csv"
                filename={`collectors-${event.id}`}
                name={event.name}
                addresses={owners}
                secondary={true}
                title={`Generates CSV file with collectors of drop #${event.id}`}
              >
                export csv
              </ButtonExportAddressCsv>,
              <ButtonMenu
                key="moments"
                primary={(
                  <LinkButton
                    key="view-moments"
                    title={`View uploaded moments on ${event.name}`}
                    href={`${POAP_MOMENTS_URL}/drop/${event.id}`}
                    external={true}
                    secondary={true}
                    icon={(
                      <svg style={{ height: '16px', width: '16px' }} viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
                        <path d="M13.3069 1.40933H11.9604C11.4851 0.994819 10.9307 0.746114 10.297 0.746114H8.31683C7.84158 0.331606 7.28713 0 6.57426 0H2.53465C1.10891 0.0829016 0 1.24352 0 2.65285V13.3471C0 14.7565 1.10891 16 2.53465 16H6.73267C7.36634 16 8 15.7513 8.47525 15.2539H10.4554C11.0891 15.2539 11.6436 15.0052 12.1188 14.5907H13.4653C14.8119 14.5907 16 13.4301 16 11.9378V4.06218C15.8416 2.65285 14.7327 1.40933 13.3069 1.40933ZM14.3366 12.0207C14.3366 12.601 13.8614 13.0984 13.3069 13.0984H12.8317C12.8317 12.9326 12.9109 12.8497 12.9109 12.6839V3.39896C12.9109 3.23316 12.9109 3.15026 12.8317 2.98446H13.3069C13.8614 2.98446 14.3366 3.48186 14.3366 4.06218V12.0207ZM1.50495 13.4301V2.65285C1.50495 2.07254 1.9802 1.57513 2.53465 1.57513H5.14851H6.57426H6.73267C7.20792 1.57513 7.52475 1.90674 7.68317 2.32124C7.68317 2.40414 7.76238 2.56995 7.76238 2.65285V13.3471C7.76238 13.4301 7.76238 13.5959 7.68317 13.6788C7.52475 14.0933 7.20792 14.4249 6.73267 14.4249H6.49505H5.14851H2.53465C1.90099 14.4249 1.50495 14.0104 1.50495 13.4301ZM9.18812 13.4301V13.1813V2.90155V2.65285C9.18812 2.56995 9.18812 2.40414 9.18812 2.32124H9.9802H10.3762C10.7723 2.32124 11.1683 2.56995 11.3267 2.98446C11.4059 3.15026 11.4059 3.23316 11.4059 3.39896V12.6839C11.4059 12.8497 11.4059 13.0155 11.3267 13.0984C11.1683 13.513 10.7723 13.7617 10.3762 13.7617H9.9802H9.18812C9.18812 13.5959 9.18812 13.513 9.18812 13.4301Z" />
                      </svg>
                    )}
                  >
                    Moments
                  </LinkButton>
                )}
                buttons={[
                  <LinkButton
                    key="upload-moment"
                    title={`Upload a moment on ${event.name}`}
                    href={`${POAP_MOMENTS_URL}/upload?drop=${event.id}`}
                    external={true}
                    secondary={true}
                    icon={<Upload />}
                  >
                    Publish
                  </LinkButton>,
                ]}
              />,
            ]}
          >
            {caching &&
              <div className="caching">
                Caching{' '}<Progress />
              </div>
            }
            {cachingError &&
              <div className="caching-error" title={cachingError.reason ? `${cachingError.reason}` : undefined}>
                <span className="caching-error-label">Error</span>
                {cachingError.message}
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
              {cachedTs && (!ts || ts > cachedTs) && event.id in inCommon && inCommon[event.id].length < owners.length && (
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
                  {loadingCollections && !collectionsError && (
                    <Card>
                      <h4>Collections</h4>
                      <Loading />
                    </Card>
                  )}
                  {!loadingCollections && collectionsError && (
                    <Card>
                      <h4>Collections</h4>
                      <ErrorMessage>
                        <p>{collectionsError}</p>
                      </ErrorMessage>
                    </Card>
                  )}
                  {!loadingCollections && !collectionsError && collectionData && (
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
                  createActiveTopButtons={(eventId) => (String(eventId) === String(event.id) ? [] : [
                    <ButtonAdd
                      key="add"
                      onAdd={() => addEvent(eventId)}
                      secondary={true}
                      borderless={true}
                      title={`Combines drop #${eventId}`}
                    />,
                  ])}
                  createActiveBottomButtons={(eventId) => ([
                    <ButtonExportAddressCsv
                      key="export-csv"
                      filename={
                        String(eventId) === String(event.id)
                          ? `collectors-${eventId}-in-common`
                          : `collectors-${eventId}-in-common-drop-${event.id}`
                      }
                      name={String(eventId) === String(event.id) ? event.name : undefined}
                      addresses={inCommon[eventId]}
                      secondary={true}
                      title={`Generates CSV file with collectors in common between drops #${eventId} and #${event.id}`}
                    >
                      export csv
                    </ButtonExportAddressCsv>,
                    <ButtonExpand
                      key="expand"
                      title={`Expands collectors in common between drops #${eventId} and #${event.id}`}
                      addresses={inCommon[eventId]}
                    />,
                  ])}
                />
              )}
            </>
        }
      </div>
    </Page>
  )
}

export default Event
