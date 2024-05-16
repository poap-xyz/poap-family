import { useCallback, useContext, useEffect, useState } from 'react'
import { Link, useLoaderData, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { formatStat } from '../utils/number'
import { SettingsContext } from '../stores/cache'
import { HTMLContext } from '../stores/html'
import { ReverseEnsContext } from '../stores/ethereum'
import { getEventAndOwners, getEventMetrics, getEventsMetrics, getEventsOwners, getInCommonEventsWithProgress, putEventInCommon } from '../loaders/api'
import { fetchPOAPs, scanAddress } from '../loaders/poap'
import { findEventsCollections } from '../loaders/collection'
import { filterInvalidOwners } from '../models/address'
import { filterInCommon, mergeAllInCommon } from '../models/in-common'
import { parseEventIds, parseExpiryDates } from '../models/event'
import { AbortedError } from '../models/error'
import { formatDate } from '../utils/date'
import Timestamp from '../components/Timestamp'
import Card from '../components/Card'
import EventButtons from '../components/EventButtons'
import Page from '../components/Page'
import TokenImageZoom from '../components/TokenImageZoom'
import Status from '../components/Status'
import Loading from '../components/Loading'
import ShadowText from '../components/ShadowText'
import ButtonLink from '../components/ButtonLink'
import Progress from '../components/Progress'
import InCommon from '../components/InCommon'
import CollectionSet from '../components/CollectionSet'
import EventsOwners from '../components/EventsOwners'
import Button from '../components/Button'
import Switch from '../components/Switch'
import WarningIcon from '../components/WarningIcon'
import WarningMessage from '../components/WarningMessage'
import ErrorMessage from '../components/ErrorMessage'
import ButtonExportAddressCsv from '../components/ButtonExportAddressCsv'
import ButtonAdd from '../components/ButtonAdd'
import ButtonDelete from '../components/ButtonDelete'
import ButtonExpand from '../components/ButtonExpand'
import '../styles/events.css'

const STATUS_INITIAL = 0
const STATUS_LOADING_OWNERS = 1
const STATUS_LOADING_SCANS = 2
const STATUS_LOADING_COMPLETE = 3

const LOADING_OWNERS = 1
const LOADING_SCANS = 2
const LOADING_CACHING = 3

function Events() {
  const navigate = useNavigate()
  const { eventIds: rawEventIds } = useParams()
  const [searchParams, setSearchParams] = useSearchParams({ all: 'false' })
  const { settings } = useContext(SettingsContext)
  const { setTitle } = useContext(HTMLContext)
  const { resolveEnsNames } = useContext(ReverseEnsContext)
  const events = useLoaderData()
  /**
   * @type {ReturnType<typeof useState<Record<number, string[]>>>}
   */
  const [owners, setOwners] = useState({})
  /**
   * @type {ReturnType<typeof useState<Record<number, { emailReservations: number; emailClaimsMinted: number; emailClaims: number; momentsUploaded: number; collectionsIncludes: number; ts: number }>>>}
   */
  const [metrics, setMetrics] = useState({})
  /**
   * @type {ReturnType<typeof useState<number>>}
   */
  const [status, setStatus] = useState(STATUS_INITIAL)
  /**
   * @type {ReturnType<typeof useState<Record<number, Error>>>}
   */
  const [errors, setErrors] = useState({})
  /**
   * @type {ReturnType<typeof useState<Error | null>>}
   */
  const [collectionsError, setCollectionsError] = useState(null)
  /**
   * @type {ReturnType<typeof useState<Record<number, number>>>}
   */
  const [loading, setLoading] = useState({})
  /**
   * @type {ReturnType<typeof useState<boolean>>}
   */
  const [loadingCollections, setLoadingCollections] = useState(false)
  /**
   * @type {ReturnType<typeof useState<Record<number, { events: Record<number, { id: number; name: string; description?: string; image_url: string; original_url: string; city: string | null; country: string | null; start_date: string; end_date: string; expiry_date: string }>; inCommon: Record<number, string[]>; ts: number }>>>}
   */
  const [eventData, setEventData] = useState({})
  /**
   * @type {ReturnType<typeof useState<Record<number, Record<string, Error>>>>}
   */
  const [eventOwnerErrors, setEventOwnerErrors] = useState({})
  /**
   * @type {ReturnType<typeof useState<Awaited<ReturnType<findEventsCollections>> | null>>}
   */
  const [collectionData, setCollectionData] = useState(null)
  /**
   * @type {ReturnType<typeof useState<Record<number, number>>>}
   */
  const [loadedCount, setLoadedCount] = useState({})
  /**
   * @type {ReturnType<typeof useState<Record<number, { progress: number; estimated: number; rate: number; }>>>}
   */
  const [loadedProgress, setLoadedProgress] = useState({})
  /**
   * @type {ReturnType<typeof useState<Record<number, boolean>>>}
   */
  const [progress, setProgress] = useState({})
  /**
   * @type {ReturnType<typeof useState<number[]>>}
   */
  const [staleEvents, setStaleEvents] = useState([])

  /**
   * @param {number} eventId
   */
  const removeLoading = (eventId) => {
    setLoading((alsoLoading) => {
      /**
       * @type {Record<number, number>}
       */
      const newLoading = {}
      for (const [loadingEventId, loading] of Object.entries(alsoLoading)) {
        if (String(eventId) !== String(loadingEventId)) {
          newLoading[loadingEventId] = loading
        }
      }
      return newLoading
    })
  }

  /**
   * @param {number} eventId
   */
  const removeProgress = (eventId) => {
    setProgress((alsoProgress) => {
      /**
       * @type {Record<number, boolean>}
       */
      const newProgress = {}
      for (const [progressEventId, isProgress] of Object.entries(alsoProgress)) {
        if (String(eventId) !== String(progressEventId)) {
          newProgress[progressEventId] = isProgress
        }
      }
      return newProgress
    })
  }

  /**
   * @param {number} eventId
   */
  const removeLoadedProgress = (eventId) => {
    setLoadedProgress((alsoProgress) => {
      /**
       * @type {Record<number, { progress: number; estimated: number; rate: number; }>}
       */
      const newProgress = {}
      for (const [loadingEventId, progress] of Object.entries(alsoProgress)) {
        if (String(eventId) !== String(loadingEventId)) {
          newProgress[loadingEventId] = progress
        }
      }
      return newProgress
    })
  }

  /**
   * @param {number} eventId
   */
  const removeErrors = (eventId) => {
    setErrors((alsoErrors) => {
      /**
       * @type {Record<number, Error>}
       */
      const newErrors = {}
      for (const [errorEventId, error] of Object.entries(alsoErrors)) {
        if (String(eventId) !== String(errorEventId)) {
          newErrors[errorEventId] = error
        }
      }
      return newErrors
    })
  }

  /**
   * @param {number} eventId
   */
  const removeEventOwnerErrors = (eventId) => {
    setEventOwnerErrors((alsoErrors) => {
      /**
       * @type {Record<number, Record<string, Error>>}
       */
      const newErrors = {}
      for (const [errorEventId, errors] of Object.entries(alsoErrors)) {
        if (String(eventId) !== String(errorEventId)) {
          newErrors[errorEventId] = errors
        }
      }
      return newErrors
    })
  }

  const loadCahedOwnersAndMetrics = useCallback(
    /**
     * @param {number} eventId
     * @param {AbortSignal} [abortSignal]
     * @returns {Promise<void>}
     */
    (eventId, abortSignal) => {
      if (eventId in owners) {
        return Promise.resolve()
      }
      removeErrors(eventId)
      setLoading((alsoLoading) => ({ ...alsoLoading, [eventId]: LOADING_OWNERS }))
      return getEventAndOwners(
        eventId,
        abortSignal,
        /*includeDescription*/false,
        /*includeMetrics*/true,
        /*refresh*/false
      ).then(
        (eventAndOwners) => {
          removeLoading(eventId)
          if (eventAndOwners != null) {
            setOwners((prevOwners) => ({ ...prevOwners, [eventId]: eventAndOwners.owners }))
            if (eventAndOwners.metrics) {
              setMetrics((oldReservations) => ({ ...oldReservations, [eventId]: eventAndOwners.metrics }))
            }
          } else {
            setOwners((prevOwners) => ({ ...prevOwners, [eventId]: [] }))
          }
          return Promise.resolve()
        },
        (err) => {
          removeLoading(eventId)
          if (!(err instanceof AbortedError) && !err.aborted) {
            setErrors((prevErrors) => ({ ...prevErrors, [eventId]: err }))
            return Promise.reject(err)
          }
          return Promise.resolve()
        }
      )
    },
    [owners]
  )

  const loadOwnersAndMetrics = useCallback(
    /**
     * @param {number} eventId
     * @param {AbortSignal} [abortSignal]
     * @returns {Promise<void>}
     */
    (eventId, abortSignal) => {
      if (eventId in owners) {
        return Promise.resolve()
      }
      removeErrors(eventId)
      setLoading((alsoLoading) => ({ ...alsoLoading, [eventId]: LOADING_OWNERS }))
      return Promise.allSettled([
        fetchPOAPs(eventId, abortSignal),
        getEventMetrics(eventId, abortSignal, searchParams.get('force') === 'true'),
      ]).then(
        ([eventOwnerTokensResult, eventMetricsResult]) => {
          removeLoading(eventId)
          if (eventOwnerTokensResult.status === 'fulfilled') {
            const eventOwnerTokens = eventOwnerTokensResult.value
            const newOwners = filterInvalidOwners(
              eventOwnerTokens.map((token) => token.owner)
            )
            setOwners((prevOwners) => ({ ...prevOwners, [eventId]: newOwners }))
          } else {
            console.error(eventOwnerTokensResult.reason)
            return Promise.reject(new Error(`Tokens for drop '${eventId}' failed to fetch`))
          }
          if (eventMetricsResult.status === 'fulfilled') {
            const eventMetrics = eventMetricsResult.value
            if (eventMetrics) {
              setMetrics((oldReservations) => ({ ...oldReservations, [eventId]: eventMetrics }))
            }
          } else {
            console.error(eventMetricsResult.reason)
          }
          return Promise.resolve()
        },
        (err) => {
          removeLoading(eventId)
          if (!(err instanceof AbortedError) && !err.aborted) {
            setErrors((prevErrors) => ({ ...prevErrors, [eventId]: err }))
            return Promise.reject(err)
          }
          return Promise.resolve()
        }
      )
    },
    [owners, searchParams]
  )

  const processEventAddress = useCallback(
    /**
     * @param {number} eventId
     * @param {string} address
     * @param {AbortSignal} [abortSignal]
     * @returns {Promise<void>}
     */
    (eventId, address, abortSignal) => {
      removeEventOwnerErrors(eventId)
      return scanAddress(address, abortSignal).then(
        (ownerTokens) => {
          for (const ownerToken of ownerTokens) {
            const ownerTokenEventId = ownerToken.event.id
            setEventData((prevEventData) => {
              if (eventId in prevEventData) {
                if (ownerTokenEventId in prevEventData[eventId].inCommon) {
                  if (prevEventData[eventId].inCommon[ownerTokenEventId].indexOf(address) === -1) {
                    return {
                      ...prevEventData,
                      [eventId]: {
                        events: { ...prevEventData[eventId].events, [ownerTokenEventId]: ownerToken.event },
                        inCommon: { ...prevEventData[eventId].inCommon, [ownerTokenEventId]: [...prevEventData[eventId].inCommon[ownerTokenEventId], address] },
                        ts: null,
                      },
                    }
                  }
                  return {
                    ...prevEventData,
                    [eventId]: {
                      events: { ...prevEventData[eventId].events, [ownerTokenEventId]: ownerToken.event },
                      inCommon: prevEventData[eventId].inCommon,
                      ts: null,
                    },
                  }
                }
                return {
                  ...prevEventData,
                  [eventId]: {
                    events: { ...prevEventData[eventId].events, [ownerTokenEventId]: ownerToken.event },
                    inCommon: { ...prevEventData[eventId].inCommon, [ownerTokenEventId]: [address] },
                    ts: null,
                  },
                }
              }
              return {
                ...prevEventData,
                [eventId]: {
                  events: { [ownerTokenEventId]: ownerToken.event },
                  inCommon: { [ownerTokenEventId]: [address] },
                  ts: null,
                },
              }
            })
          }
          setLoadedCount((prevLoadedCount) => ({ ...prevLoadedCount, [eventId]: (prevLoadedCount[eventId] ?? 0) + 1 }))
          return Promise.resolve()
        },
        (err) => {
          setEventOwnerErrors((oldEventOwnerErrors) => ({
            ...oldEventOwnerErrors,
            [eventId]: {
              ...(oldEventOwnerErrors[eventId] ?? {}),
              [address]: err,
            },
          }))
          if (!(err instanceof AbortedError) && !err.aborted) {
            return Promise.reject(err)
          }
          return Promise.resolve()
        }
      )
    },
    []
  )

  const processEvent = useCallback(
    /**
     * @param {number} eventId
     * @param {Record<string, AbortController>} controllers
     */
    (eventId, controllers) => {
      const processedOwners = []
      setLoading((alsoLoading) => ({ ...alsoLoading, [eventId]: LOADING_SCANS }))
      setProgress((oldProgress) => ({ ...oldProgress, [eventId]: true }))
      let promise = new Promise((r) => { r() })
      for (const owner of owners[eventId]) {
        if (processedOwners.indexOf(owner) !== -1) {
          continue
        }
        promise = promise.then(
          () => processEventAddress(eventId, owner, controllers[owner].signal),
          () => processEventAddress(eventId, owner, controllers[owner].signal)
        )
        processedOwners.push(owner)
      }
      promise.then(
        () => {
          removeProgress(eventId)
          removeLoading(eventId)
        },
        (err) => {
          if (!(err instanceof AbortedError) && !err.aborted) {
            console.error(err)
          }
        }
      )
      return promise
    },
    [owners, processEventAddress]
  )

  const loadCollections = useCallback(
    () => {
      const eventIds = Object.keys(events).map(
        (rawEventId) => parseInt(rawEventId)
      )
      setLoadingCollections(true)
      findEventsCollections(eventIds).then((eventCollectionsData) => {
        setCollectionData(eventCollectionsData)
        setLoadingCollections(false)
      }).catch((err) => {
        setCollectionsError(err?.message ?? 'Could not load collections')
        setLoadingCollections(false)
      })
    },
    [events]
  )

  useEffect(
    () => {
      setTitle(Object.values(events).map((event) => event.name).join(', '))
    },
    [events, setTitle]
  )

  useEffect(
    () => {
      const eventIds = Object.keys(events).map(
        (rawEventId) => parseInt(rawEventId)
      )
      const requests = []
      const force = searchParams.get('force') === 'true'
      if (status === STATUS_INITIAL) {
        if (!force) {
          const controller = new AbortController()
          const expiryDates = parseExpiryDates(events)
          Promise.all([
            getEventsOwners(eventIds, controller.signal, expiryDates),
            getEventsMetrics(eventIds, controller.signal, expiryDates),
          ]).then(
            ([eventsOwners, eventsMetrics]) => {
              if (eventsMetrics) {
                const foundMetrics = Object.fromEntries(
                  Object.entries(eventsMetrics).filter(([, metrics]) => metrics != null)
                )
                setMetrics((oldReservations) => ({ ...oldReservations, ...foundMetrics }))
              }
              if (eventsOwners) {
                const newOwners = Object.fromEntries(
                  Object.entries(eventsOwners)
                    .map(
                      ([eventId, eventOwners]) => [
                        eventId,
                        eventOwners == null ? [] : eventOwners.owners,
                      ]
                    )
                )
                setOwners((oldOwners) => ({ ...oldOwners, ...newOwners }))
                if (Object.keys(newOwners).length === eventIds.length) {
                  resolveEnsNames(
                    [
                      ...new Set(
                        Object.values(newOwners).reduce(
                          (allOwners, eventOwners) => ([
                            ...allOwners,
                            ...eventOwners,
                          ]),
                          []
                        ),
                      ),
                    ]
                  )
                  setStatus(STATUS_LOADING_SCANS)
                } else {
                  setStatus(STATUS_LOADING_OWNERS)
                }
              } else {
                setStatus(STATUS_LOADING_OWNERS)
              }
            },
            (err) => {
              console.error(err)
              setStatus(STATUS_LOADING_OWNERS)
            }
          )
          requests.push(controller)
        } else {
          setStatus(STATUS_LOADING_OWNERS)
        }
      } else if (status === STATUS_LOADING_OWNERS) {
        let promise = new Promise((r) => { r() })
        for (const eventId of eventIds) {
          const controller = new AbortController()
          promise = promise.then(
            () => force ? loadOwnersAndMetrics(eventId, controller.signal) : loadCahedOwnersAndMetrics(eventId, controller.signal),
            () => force ? loadOwnersAndMetrics(eventId, controller.signal) : loadCahedOwnersAndMetrics(eventId, controller.signal)
          )
          requests.push(controller)
        }
      }
      return () => {
        if (status === STATUS_LOADING_OWNERS && requests.length > 0) {
          for (const request of requests) {
            request.abort()
          }
        }
      }
    },
    [events, status, loadCahedOwnersAndMetrics, loadOwnersAndMetrics, resolveEnsNames, searchParams]
  )

  useEffect(
    () => {
      const eventIds = Object.keys(events).map(
        (rawEventId) => parseInt(rawEventId)
      )
      const requests = []
      const force = searchParams.get('force') === 'true'
      if (status === STATUS_LOADING_SCANS) {
        let promise = new Promise((r) => { r() })
        for (const eventId of eventIds) {
          const controller = new AbortController()
          const ownerControllers = owners[eventId].reduce(
            (controllers, owner) => ({
              ...controllers,
              [owner]: new AbortController(),
            }),
            {}
          )
          const process = force ? () => processEvent(eventId, ownerControllers) : () => {
            setLoading((alsoLoading) => ({ ...alsoLoading, [eventId]: LOADING_SCANS }))
            return getInCommonEventsWithProgress(
              eventId,
              controller.signal,
              /*onProgress*/({ progress, estimated, rate }) => {
                setLoadedProgress((alsoProgress) => ({ ...alsoProgress, [eventId]: { progress, estimated, rate } }))
              }
            ).then(
              (result) => {
                removeLoadedProgress(eventId)
                if (!result) {
                  return processEvent(eventId, ownerControllers)
                } else {
                  setEventData((prevEventData) => ({
                    ...prevEventData,
                    [eventId]: {
                      events: result.events,
                      inCommon: result.inCommon,
                      ts: result.ts,
                    },
                  }))
                  if (eventId in result.inCommon) {
                    setLoadedCount((prevLoadedCount) => ({
                      ...prevLoadedCount,
                      [eventId]: result.inCommon[eventId].length,
                    }))
                  }
                  removeLoading(eventId)
                  return Promise.resolve()
                }
              },
              (err) => {
                removeLoadedProgress(eventId)
                console.error(err)
                return processEvent(eventId, ownerControllers)
              }
            )
          }
          if (searchParams.get('all') === 'true') {
            requests.push(...Object.values(ownerControllers))
          } else {
            requests.push(controller, ...Object.values(ownerControllers))
          }
          promise = promise.then(process, process)
        }
      }
      return () => {
        if (status === STATUS_LOADING_SCANS && requests.length > 0) {
          for (const request of requests) {
            request.abort()
          }
        }
      }
    },
    [events, owners, status, processEvent, searchParams]
  )

  useEffect(
    () => {
      if (status === STATUS_INITIAL) {
        if (Object.keys(events).length === Object.keys(owners).length) {
          resolveEnsNames(
            [
              ...new Set(
                Object.values(owners).reduce(
                  (allOwners, eventOwners) => ([ ...allOwners, ...eventOwners ]),
                  []
                ),
              )
            ]
          )
          setStatus(STATUS_LOADING_SCANS)
        }
      } else if (status === STATUS_LOADING_OWNERS) {
        if (Object.keys(events).length === Object.keys(owners).length) {
          setStatus((prevStatus) => {
            if (prevStatus === STATUS_LOADING_OWNERS) {
              return STATUS_LOADING_SCANS
            }
            return STATUS_LOADING_COMPLETE
          })
        }
      }
    },
    [events, owners, status, resolveEnsNames]
  )

  useEffect(
    () => {
      if (status === STATUS_LOADING_SCANS) {
        const eventIds = Object.keys(events).map(
          (rawEventId) => parseInt(rawEventId)
        )
        let eventsLoaded = 0
        for (const eventId of eventIds) {
          if ((loadedCount[eventId] ?? 0) === owners[eventId].length) {
            eventsLoaded++
            if (
              eventId in eventData &&
              !eventData[eventId].ts &&
              !(eventId in errors) &&
              !(eventId in loading)
            ) {
              const inCommonProcessed = filterInCommon(
                eventData[eventId].inCommon
              )
              const inCommonProcessedEventIds = Object
                .keys(inCommonProcessed)
                .map((rawEventId) => parseInt(rawEventId))
              if (inCommonProcessedEventIds.length > 0) {
                removeErrors(eventId)
                setLoading((alsoLoading) => ({ ...alsoLoading, [eventId]: LOADING_CACHING }))
                putEventInCommon(eventId, inCommonProcessed).then(
                  () => {
                    setEventData((prevEventData) => ({
                      ...prevEventData,
                      [eventId]: {
                        events: prevEventData[eventId].events,
                        inCommon: prevEventData[eventId].inCommon,
                        ts: Math.trunc(Date.now() / 1000),
                      },
                    }))
                    removeLoading(eventId)
                  },
                  (err) => {
                    console.error(err)
                    setErrors((prevErrors) => ({
                      ...prevErrors,
                      [eventId]: new Error('Could not cache drop', { cause: err }),
                    }))
                    removeLoading(eventId)
                  }
                )
              }
            }
          } else if (
            !(eventId in loading) &&
            eventId in eventData &&
            eventId in eventData[eventId].inCommon &&
            eventData[eventId].inCommon[eventId].length !== owners[eventId].length
          ) {
            eventsLoaded++
            setStaleEvents((oldStaleEvents) => ([...new Set([...oldStaleEvents, eventId])]))
          }
        }
        if (eventsLoaded === eventIds.length) {
          setStatus(STATUS_LOADING_COMPLETE)
        }
      }
    },
    [status, events, loadedCount, owners, errors, eventData, loading]
  )

  useEffect(
    () => {
      if (
        settings.showCollections &&
        status === STATUS_LOADING_COMPLETE
      ) {
        loadCollections()
      }
    },
    [
      settings.showCollections,
      status,
      loadCollections,
    ]
  )

  /**
   * @param {number} eventId
   */
  const retryLoadOwners = (eventId) => {
    removeErrors(eventId)
    loadCahedOwnersAndMetrics(eventId)
  }

  /**
   * @param {number} eventId
   * @param {string} address
   */
  const retryEventAddress = (eventId, address) => {
    setLoading((alsoLoading) => ({ ...alsoLoading, [eventId]: LOADING_SCANS }))
    setProgress((oldProgress) => ({ ...oldProgress, [eventId]: true }))
    setEventOwnerErrors((oldEventOwnerErrors) => {
      if (eventId in oldEventOwnerErrors && address in oldEventOwnerErrors[eventId]) {
        if (Object.keys(oldEventOwnerErrors[eventId]).length === 1) {
          delete oldEventOwnerErrors[eventId]
        } else {
          delete oldEventOwnerErrors[eventId][address]
        }
      }
      return oldEventOwnerErrors
    })
    processEventAddress(eventId, address).then(() => {
      if ((loadedCount[eventId] ?? 0) + 1 === owners[eventId].length) {
        removeProgress(eventId)
        removeLoading(eventId)
      }
    })
  }

  /**
   * @param {number} eventId
   */
  const addEvent = (eventId) => {
    navigate(`/events/${parseEventIds(`${rawEventIds},${eventId}`).join(',')}`)
  }

  /**
   * @param {number} eventId
   */
  const delEvent = (eventId) => {
    const eventIds = parseEventIds(rawEventIds).filter((paramEventId) => String(paramEventId) !== String(eventId))
    if (eventIds.length === 1) {
      navigate(`/event/${eventIds[0]}`)
    } else if (eventIds.length > 0) {
      navigate(`/events/${eventIds.join(',')}`)
    } else {
      navigate('/')
    }
  }

  /**
   * @param {number[]} eventIds
   */
  const addEvents = (eventIds) => {
    if (eventIds.length === 0) {
      return
    }
    const newEventIds = parseEventIds(`${rawEventIds},${eventIds.join(',')}`)
    if (newEventIds.length > 0) {
      navigate(`/events/${newEventIds.join(',')}`)
    }
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

  const handleAllChange = (checked) => {
    setSearchParams({ all: checked ? 'true' : 'false' })
  }

  const handleViewAll = () => {
    setSearchParams({ all: 'true' })
  }

  /**
   * @type {Record<number, string[]>}
   */
  let inCommon = {}
  if (status === STATUS_LOADING_COMPLETE) {
    inCommon = mergeAllInCommon(
      Object.values(eventData).map(
        (oneEventData) => oneEventData?.inCommon ?? {}
      ),
      searchParams.get('all') === 'true'
    )
  }

  const allEvents = Object.values(eventData).reduce(
    (allEvents, data) => ({ ...allEvents, ...data.events }),
    {}
  )

  const refreshCache = () => {
    setSearchParams({ force: 'true' })
    setOwners({})
    setMetrics({})
    setStatus(STATUS_INITIAL)
    setErrors({})
    setLoading({})
    setEventData({})
    setEventOwnerErrors({})
    setLoadedCount({})
    setLoadedProgress({})
    setProgress({})
    setStaleEvents([])
    setCollectionData(null)
    setCollectionsError(null)
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
                      checked={searchParams.get('all') === 'true'}
                      onChange={(event) => handleAllChange(event.target.checked)}
                      labelOn="X"
                      labelOff="X"
                    />
                    <span>All</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {Object.values(events).map((event) => (
                  <tr key={event.id}>
                    <td>
                      <div className="event-cell-info">
                        <div className="event-image">
                          <TokenImageZoom event={event} zoomSize={512} size={48} />
                          <Link to={`/event/${event.id}`} className="event-id">#{event.id}</Link>
                        </div>
                        <div className="event-data">
                          <h2>{event.name}</h2>
                          <div className="event-date">{formatDate(event.start_date)}</div>
                          {event.city && event.country && <div className="place">{event.city}, {event.country}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="event-cell-owners">
                      {(status === STATUS_INITIAL || (event.id in loading && loading[event.id] === LOADING_OWNERS)) && !(event.id in owners) && (
                        <Loading small={true} />
                      )}
                      {event.id in owners && (
                        <ShadowText grow={true} medium={true}>
                          {formatStat(owners[event.id].length)}
                          {event.id in metrics && metrics[event.id] && typeof metrics[event.id].emailReservations === 'number' && metrics[event.id].emailReservations > 0 && ` + ${formatStat(metrics[event.id].emailReservations)}`}
                        </ShadowText>
                      )}
                    </td>
                    <td>
                      <div className="event-status">
                        <Status
                          loading={(status === STATUS_INITIAL || event.id in loading) && loading[event.id] !== LOADING_CACHING && !(event.id in errors)}
                          caching={event.id in loading && loading[event.id] === LOADING_CACHING && !(event.id in errors)}
                          error={event.id in errors || (event.id in eventOwnerErrors && !(status === STATUS_INITIAL || event.id in loading))}
                        />
                        {event.id in errors && (
                          <>
                            <span
                              className="status-error-message"
                              title={errors[event.id].cause ? `${errors[event.id].cause}` : undefined}
                            >
                              {errors[event.id].message}
                            </span>
                            {' '}
                            <ButtonLink onClick={() => retryLoadOwners(event.id)}>retry</ButtonLink>
                          </>
                        )}
                      </div>
                    </td>
                    <td>
                      {event.id in loadedProgress && (
                        <Progress
                          value={loadedProgress[event.id].progress}
                          max={1}
                          showPercent={true}
                          eta={loadedProgress[event.id].estimated}
                          rate={loadedProgress[event.id].rate}
                        />
                      )}
                      {event.id in progress && (
                        <Progress
                          value={loadedCount[event.id]}
                          max={owners[event.id].length}
                          showValue={loadedCount[event.id] > 0}
                        />
                      )}
                      {event.id in loading && loading[event.id] === LOADING_CACHING && (
                        <Progress />
                      )}
                      {event.id in eventOwnerErrors && Object.entries(eventOwnerErrors[event.id]).map(
                        ([address, error]) => (
                          <p key={address} className="status-error-message">
                            <code>[{address}]</code>{' '}{error.message}{' '}
                            <ButtonLink onClick={() => retryEventAddress(event.id, address)}>retry</ButtonLink>
                          </p>
                        )
                      )}
                      {event.id in eventData && eventData[event.id].ts && (
                        <p className="status-cached-ts">
                          Cached <Timestamp ts={eventData[event.id].ts} />
                          {!(event.id in loading) && event.id in eventData && event.id in eventData[event.id].inCommon && eventData[event.id].inCommon[event.id].length !== owners[event.id].length && (
                            <>{' '}<WarningIcon title="There have been new mints since this POAP was cached" /></>
                          )}
                        </p>
                      )}
                    </td>
                    <td align="right">
                      <EventButtons
                        event={event}
                        buttons={[
                          <ButtonDelete
                            key="del"
                            onDelete={() => delEvent(event.id)}
                            title={`Removes drop #${event.id}`}
                          />,
                        ]}
                        invert={true}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
        {staleEvents && staleEvents.length > 0 && (
          <WarningMessage>
            There have been new mints in {staleEvents.length} POAP{staleEvents.length === 1 ? '' : 's'} since cached,{' '}
            <ButtonLink onClick={() => refreshCache()}>refresh all</ButtonLink>.
          </WarningMessage>
        )}
        {status !== STATUS_LOADING_COMPLETE && (
          <Card shink={true}>
            <Loading
              title={
                status === STATUS_INITIAL ?
                  'Loading cache' : (
                  status === STATUS_LOADING_OWNERS ?
                    'Loading collectors' : (
                      status === STATUS_LOADING_SCANS ?
                        'Loading drops' :
                        undefined
                    )
                )
              }
              count={Object.values(loadedCount).length}
              total={Object.values(events).length}
            />
          </Card>
        )}
        {status === STATUS_LOADING_COMPLETE && (
          <>
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
                    <ErrorMessage error={collectionsError} />
                  </Card>
                )}
                {!loadingCollections && !collectionsError && collectionData && (
                  <CollectionSet
                    showEmpty={metrics && Object.values(metrics).reduce((total, metric) => total + metric.collectionsIncludes, 0) > 0}
                    emptyMessage={(
                      <>
                        No collections found that includes exactly all {Object.keys(events).length} POAPs,{' '}
                        <ButtonLink onClick={handleViewAll}>view related collections</ButtonLink>.
                      </>
                    )}
                    collectionMap={{
                      [`${collectionData.collections.length} collections`]: collectionData.collections,
                      [`${collectionData.related.length} related collections`]: searchParams.get('all') === 'true' ? collectionData.related : [],
                    }}
                  />
                )}
              </>
            )}
            <EventsOwners
              owners={owners}
              inCommon={inCommon}
              events={allEvents}
              all={searchParams.get('all') === 'true'}
            />
            <InCommon
              inCommon={inCommon}
              events={allEvents}
              createButtons={(eventIds) => ([
                <Button
                  key="add-all"
                  disabled={eventIds.length === 0 || eventIds.every((eventId) => eventId in events)}
                  onClick={() => addEvents(eventIds)}
                >
                  Add selected
                </Button>,
                <Button
                  key="open-all"
                  secondary={true}
                  disabled={eventIds.length === 0 || (eventIds.every((eventId) => eventId in events) && Object.keys(events).every((eventId) => eventIds.indexOf(eventId) !== -1))}
                  onClick={() => openEvents(eventIds)}
                >
                  Open
                </Button>,
              ])}
              createActiveTopButtons={(eventId) => (eventId in events ? [] : [
                <ButtonAdd
                  key="add"
                  onAdd={() => addEvent(eventId)}
                  title={`Adds drop #${eventId}`}
                />,
              ])}
              createActiveBottomButtons={(eventId) => ([
                <ButtonExportAddressCsv
                  key="export-csv"
                  filename={
                    Object.keys(events).length === 1
                      ? (
                        String(eventId) === String(Object.keys(events)[0])
                          ? `collectors-${eventId}-in-common`
                          : `collectors-${eventId}-in-common-drop-${Object.keys(events)[0]}`
                      )
                      : `collectors-${eventId}-in-common-drops-${Object.keys(events).join('+')}`
                  }
                  name={Object.keys(events).length === 1 && String(eventId) === String(Object.keys(events)[0]) ? Object.values(events)[0].name : undefined}
                  addresses={inCommon[eventId]}
                  secondary={true}
                  title={`Generates CSV file with collectors in common between drops #${eventId} and #${Object.keys(events).join(', #')}`}
                >
                  export csv
                </ButtonExportAddressCsv>,
                <ButtonExpand
                  key="expand"
                  title={`Expands collectors in common between drops #${eventId} and #${Object.keys(events).join(', #')}`}
                  addresses={inCommon[eventId]}
                />,
              ])}
            />
          </>
        )}
      </div>
    </Page>
  )
}

export default Events
