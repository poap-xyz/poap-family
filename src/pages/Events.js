import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { Link, useLoaderData, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { formatStat } from 'utils/number'
import { SettingsContext } from 'stores/cache'
import { HTMLContext } from 'stores/html'
import { ReverseEnsContext } from 'stores/ethereum'
import {
  getEventAndOwners,
  getEventMetrics,
  getEventsMetrics,
  getEventsOwners,
  getInCommonEventsWithProgress,
  putEventInCommon,
} from 'loaders/api'
import { fetchPOAPs, scanAddress } from 'loaders/poap'
import { findEventsCollections } from 'loaders/collection'
import { filterInvalidOwners } from 'models/address'
import { filterInCommon, mergeAllInCommon } from 'models/in-common'
import { parseEventIds, parseExpiryDates } from 'models/event'
import { Drops } from 'models/drop'
import { AbortedError } from 'models/error'
import { union, uniq } from 'utils/array'
import { formatDate } from 'utils/date'
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
import InCommon from 'components/InCommon'
import CollectionSet from 'components/CollectionSet'
import EventsOwners from 'components/EventsOwners'
import Button from 'components/Button'
import Switch from 'components/Switch'
import WarningIcon from 'components/WarningIcon'
import WarningMessage from 'components/WarningMessage'
import ErrorMessage from 'components/ErrorMessage'
import ButtonExportAddressCsv from 'components/ButtonExportAddressCsv'
import ButtonAdd from 'components/ButtonAdd'
import ButtonDelete from 'components/ButtonDelete'
import ButtonExpand from 'components/ButtonExpand'
import 'styles/events.css'

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
  const loaderData = useLoaderData()
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
   * @type {ReturnType<typeof useState<Record<number, { events: Record<number, { id: number; name: string; description?: string; image_url: string; original_url: string; city: string | null; country: string | null; start_date: string; end_date: string; expiry_date: string }>; inCommon: Record<number, string[]>; ts: number | null }>>>}
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

  const force = searchParams.get('force') === 'true'
  const all = searchParams.get('all') === 'true'

  const events = useMemo(
    () => Drops(loaderData, /*includeDescription*/false),
    [loaderData]
  )

  /**
   * @param {number} eventId
   * @param {string[]} owners
   */
  const updateEventOwners = (eventId, owners) => {
    setOwners((prevOwners) => ({
      ...prevOwners,
      [eventId]: filterInvalidOwners(owners),
    }))
  }

  /**
   * @param {Record<number, string[]>} eventsOwners 
   */
  const updateEventsOwners = (eventsOwners) => {
    setOwners((prevOwners) => ({
      ...prevOwners,
      ...Object.fromEntries(
        Object.entries(eventsOwners).map(
          ([rawEventId, owners]) => [
            rawEventId,
            filterInvalidOwners(owners),
          ]
        )
      ),
    }))
  }

  /**
   * @param {number} eventId
   * @param {{ emailReservations: number; emailClaimsMinted: number; emailClaims: number; momentsUploaded: number; collectionsIncludes: number; ts: number }} metrics
   */
  const updateEventMetrics = (eventId, metrics) => {
    if (metrics == null) {
      return
    }
    setMetrics((prevMetrics) => ({
      ...prevMetrics,
      [eventId]: metrics,
    }))
  }

  /**
   * @param {Record<number, { emailReservations: number; emailClaimsMinted: number; emailClaims: number; momentsUploaded: number; collectionsIncludes: number; ts: number }>} eventsMetrics 
   */
  const updateEventsMetrics = (eventsMetrics) => {
    if (eventsMetrics == null) {
      return
    }
    setMetrics((prevMetrics) => ({
      ...prevMetrics,
      ...Object.fromEntries(
        Object.entries(eventsMetrics).filter(([, metrics]) => metrics != null)
      ),
    }))
  }

  /**
   * @param {number} eventId
   */
  const setLoadingOwners = (eventId) => {
    setLoading((alsoLoading) => ({
      ...alsoLoading,
      [eventId]: LOADING_OWNERS,
    }))
  }

  /**
   * @param {number} eventId
   */
  const setLoadingScans = (eventId) => {
    setLoading((alsoLoading) => ({
      ...alsoLoading,
      [eventId]: LOADING_SCANS,
    }))
  }

  /**
   * @param {number} eventId
   */
  const setLoadingCaching = (eventId) => {
    setLoading((alsoLoading) => ({
      ...alsoLoading,
      [eventId]: LOADING_CACHING,
    }))
  }

  /**
   * @param {number} eventId
   */
  const removeLoading = (eventId) => {
    setLoading((alsoLoading) => {
      if (alsoLoading == null) {
        return {}
      }
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
  const enableProgress = (eventId) => {
    setProgress((oldProgress) => ({
      ...oldProgress,
      [eventId]: true,
    }))
  }

  /**
   * @param {number} eventId
   */
  const disableProgress = (eventId) => {
    setProgress((alsoProgress) => {
      if (alsoProgress == null) {
        return {}
      }
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
   * @param {Error} err
   */
  const updateError = (eventId, err) => {
    setErrors((prevErrors) => ({
      ...prevErrors,
      [eventId]: err,
    }))
  }

  /**
   * @param {number} eventId
   */
  const removeError = (eventId) => {
    setErrors((alsoErrors) => {
      if (alsoErrors == null) {
        return {}
      }
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
   * @param {string} address
   * @param {Error} err
   */
  const updateEventOwnerError = (eventId, address, err) => {
    setEventOwnerErrors((oldEventOwnerErrors) => ({
      ...(oldEventOwnerErrors ?? {}),
      [eventId]: {
        ...((oldEventOwnerErrors ?? {})[eventId] ?? {}),
        [address]: err,
      },
    }))
  }

  /**
   * @param {number} eventId
   * @param {string} address
   */
  const removeEventOwnerError = (eventId, address) => {
    setEventOwnerErrors((oldEventOwnerErrors) => {
      if (oldEventOwnerErrors == null) {
        return {}
      }
      if (eventId in oldEventOwnerErrors && address in oldEventOwnerErrors[eventId]) {
        if (Object.keys(oldEventOwnerErrors[eventId]).length === 1) {
          delete oldEventOwnerErrors[eventId]
        } else {
          delete oldEventOwnerErrors[eventId][address]
        }
      }
      return oldEventOwnerErrors
    })
  }

  /**
   * @param {number} eventId
   */
  const removeEventOwnerErrors = (eventId) => {
    setEventOwnerErrors((alsoErrors) => {
      if (alsoErrors == null) {
        return {}
      }
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

  /**
   * @param {number} eventId
   * @param {string} address
   * @param {{ id: number; name: string; description?: string; image_url: string; original_url: string; city: string | null; country: string | null; start_date: string; end_date: string; expiry_date: string }} event
   */
  const updateEventOwnerData = (eventId, address, event) => {
    setEventData((prevEventData) => {
      if (prevEventData == null) {
        return {
          [eventId]: {
            events: {
              [event.id]: event,
            },
            inCommon: {
              [event.id]: [address],
            },
            ts: null,
          },
        }
      }
      if (eventId in prevEventData) {
        if (event.id in prevEventData[eventId].inCommon) {
          if (!prevEventData[eventId].inCommon[event.id].includes(address)) {
            return {
              ...prevEventData,
              [eventId]: {
                events: {
                  ...prevEventData[eventId].events,
                  [event.id]: event,
                },
                inCommon: {
                  ...prevEventData[eventId].inCommon,
                  [event.id]: [
                    ...prevEventData[eventId].inCommon[event.id],
                    address,
                  ],
                },
                ts: null,
              },
            }
          }
          return {
            ...prevEventData,
            [eventId]: {
              events: {
                ...prevEventData[eventId].events,
                [event.id]: event,
              },
              inCommon: prevEventData[eventId].inCommon,
              ts: null,
            },
          }
        }
        return {
          ...prevEventData,
          [eventId]: {
            events: {
              ...prevEventData[eventId].events,
              [event.id]: event,
            },
            inCommon: {
              ...prevEventData[eventId].inCommon,
              [event.id]: [address],
            },
            ts: null,
          },
        }
      }
      return {
        ...prevEventData,
        [eventId]: {
          events: {
            [event.id]: event,
          },
          inCommon: {
            [event.id]: [address],
          },
          ts: null,
        },
      }
    })
  }

  /**
   * @param {number} eventId
   * @param {{ events: Record<number, { id: number; name: string; description?: string; image_url: string; original_url: string; city: string | null; country: string | null; start_date: string; end_date: string; expiry_date: string }>; inCommon: Record<number, string[]>; ts: number }} data
   */
  const updateEventData = (eventId, data) => {
    setEventData((prevEventData) => ({
      ...prevEventData,
      [eventId]: {
        events: data.events,
        inCommon: data.inCommon,
        ts: data.ts,
      },
    }))
  }

  /**
   * @param {number} eventId
   * @param {number} [ts]
   */
  const updateEventCachedTs = (eventId, ts) => {
    if (ts == null) {
      ts = Math.trunc(Date.now() / 1000)
    }
    setEventData((prevEventData) => ({
      ...(prevEventData ?? {}),
      [eventId]: {
        events: (prevEventData ?? {})[eventId].events,
        inCommon: (prevEventData ?? {})[eventId].inCommon,
        ts,
      },
    }))
  }

  /**
   * @param {number} eventId
   */
  const incrLoadedCount = (eventId) => {
    setLoadedCount((prevLoadedCount) => ({
      ...prevLoadedCount,
      [eventId]: ((prevLoadedCount ?? {})[eventId] ?? 0) + 1,
    }))
  }

  /**
   * @param {number} eventId
   * @param {number} count
   */
  const fixLoadedCount = (eventId, count) => {
    setLoadedCount((prevLoadedCount) => ({
      ...prevLoadedCount,
      [eventId]: count,
    }))
  }

  /**
   * @param {number} eventId
   */
  const addStaleEvent = (eventId) => {
    setStaleEvents((oldStaleEvents) => uniq([
      ...(oldStaleEvents ?? []),
      eventId,
    ]))
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
      removeError(eventId)
      setLoadingOwners(eventId)
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
            updateEventOwners(eventId, eventAndOwners.owners)
            if (eventAndOwners.metrics) {
              updateEventMetrics(eventId, eventAndOwners.metrics)
            }
          } else {
            const error = new Error('Could not fetch drop and collectors')
            updateError(eventId, error)
            return Promise.reject(error)
          }
          return Promise.resolve()
        },
        (err) => {
          removeLoading(eventId)
          if (!(err instanceof AbortedError) && !err.aborted) {
            updateError(eventId, new Error('Could not fetch drop and collectors', {
              cause: err,
            }))
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
      removeError(eventId)
      setLoadingOwners(eventId)
      return Promise.allSettled([
        fetchPOAPs(eventId, abortSignal),
        getEventMetrics(eventId, abortSignal, force),
      ]).then(
        ([eventOwnerTokensResult, eventMetricsResult]) => {
          removeLoading(eventId)
          if (eventOwnerTokensResult.status === 'fulfilled') {
            updateEventOwners(
              eventId,
              eventOwnerTokensResult.value.map((token) => token.owner)
            )
          } else {
            console.error(eventOwnerTokensResult.reason)
            if (
              !(eventOwnerTokensResult.reason instanceof AbortedError) &&
              !eventOwnerTokensResult.reason.aborted
            ) {
              updateError(
                eventId,
                new Error(`Tokens for drop '${eventId}' failed to fetch`, {
                  cause: eventOwnerTokensResult.reason,
                })
              )
            }
            return Promise.reject(
              new Error(`Tokens for drop '${eventId}' failed to fetch`, {
                cause: eventOwnerTokensResult.reason,
              })
            )
          }
          if (eventMetricsResult.status === 'fulfilled') {
            if (eventMetricsResult.value) {
              updateEventMetrics(eventId, eventMetricsResult.value)
            }
          } else {
            console.error(eventMetricsResult.reason)
          }
          return Promise.resolve()
        },
        (err) => {
          removeLoading(eventId)
          if (!(err instanceof AbortedError) && !err.aborted) {
            updateError(
              eventId,
              new Error('Could not fetch collectors or metrics', {
                cause: err,
              })
            )
            return Promise.reject(err)
          }
          return Promise.resolve()
        }
      )
    },
    [owners, force]
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
            if (ownerToken.event) {
              updateEventOwnerData(eventId, address, ownerToken.event)
            } else {
              updateEventOwnerError(
                eventId,
                address,
                new Error(`Missing token drop for ${address}`)
              )
            }
          }
          incrLoadedCount(eventId)
          return Promise.resolve()
        },
        (err) => {
          updateEventOwnerError(
            eventId,
            address,
            new Error(`Missing token drop for ${address}`, {
              cause: err,
            })
          )
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
      /**
       * @type {string[]}
       */
      const processedOwners = []
      setLoadingScans(eventId)
      enableProgress(eventId)
      let promise = new Promise((r) => { r(undefined) })
      for (const owner of owners[eventId]) {
        if (processedOwners.indexOf(owner) !== -1) {
          continue
        }
        const process = () => processEventAddress(
          eventId,
          owner,
          controllers[owner].signal
        )
        promise = promise.then(process, process)
        processedOwners.push(owner)
      }
      promise.then(
        () => {
          disableProgress(eventId)
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
        setCollectionsError(new Error('Could not load collections', {
          cause: err,
        }))
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
      /**
       * @type {AbortController[]}
       */
      const controllers = []
      if (status === STATUS_INITIAL) {
        if (!force) {
          const controller = new AbortController()
          const expiryDates = parseExpiryDates(events)
          Promise.all([
            getEventsOwners(eventIds, controller.signal, expiryDates),
            getEventsMetrics(eventIds, controller.signal, expiryDates),
          ]).then(
            ([eventsOwners, eventsMetrics]) => {
              updateEventsMetrics(eventsMetrics)
              if (eventsOwners) {
                const newOwners = Object.fromEntries(
                  Object.entries(eventsOwners)
                    .filter(([, eventOwners]) => eventOwners != null)
                    .map(
                      ([rawEventId, eventOwners]) => [
                        rawEventId,
                        eventOwners.owners,
                      ]
                    )
                )
                updateEventsOwners(newOwners)
                if (Object.keys(newOwners).length === eventIds.length) {
                  resolveEnsNames(
                    union(...Object.values(newOwners))
                  ).catch((err) => {
                    console.error(err)
                  })
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
          controllers.push(controller)
        } else {
          setStatus(STATUS_LOADING_OWNERS)
        }
      } else if (status === STATUS_LOADING_OWNERS) {
        let promise = new Promise((r) => { r(undefined) })
        for (const eventId of eventIds) {
          const controller = new AbortController()
          const process = () => force
            ? loadOwnersAndMetrics(eventId, controller.signal)
            : loadCahedOwnersAndMetrics(eventId, controller.signal)
          promise = promise.then(process, process)
          controllers.push(controller)
        }
      }
      return () => {
        if (status === STATUS_LOADING_OWNERS && controllers.length > 0) {
          for (const controller of controllers) {
            controller.abort()
          }
        }
      }
    },
    [
      events,
      status,
      loadCahedOwnersAndMetrics,
      loadOwnersAndMetrics,
      resolveEnsNames,
      force,
    ]
  )

  useEffect(
    () => {
      const eventIds = Object.keys(events).map(
        (rawEventId) => parseInt(rawEventId)
      )
      /**
       * @type {AbortController[]}
       */
      const controllers = []
      if (status === STATUS_LOADING_SCANS) {
        let promise = new Promise((r) => { r(undefined) })
        for (const eventId of eventIds) {
          const controller = new AbortController()
          /**
           * @type {Record<string, AbortController>}
           */
          const ownerControllers = owners[eventId].reduce(
            (controllers, owner) => ({
              ...controllers,
              [owner]: new AbortController(),
            }),
            {}
          )
          const process = force ? () => processEvent(eventId, ownerControllers) : () => {
            setLoadingScans(eventId)
            return getInCommonEventsWithProgress(
              eventId,
              controller.signal,
              /*onProgress*/({ progress, estimated, rate }) => {
                if (progress != null && estimated != null && rate != null) {
                  setLoadedProgress((alsoProgress) => ({
                    ...alsoProgress,
                    [eventId]: { progress, estimated, rate },
                  }))
                }
              }
            ).then(
              (result) => {
                removeLoadedProgress(eventId)
                if (result == null) {
                  return processEvent(eventId, ownerControllers)
                } else {
                  updateEventData(eventId, result)
                  if (eventId in result.inCommon) {
                    fixLoadedCount(eventId, result.inCommon[eventId].length)
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
          if (all) {
            controllers.push(...Object.values(ownerControllers))
          } else {
            controllers.push(controller, ...Object.values(ownerControllers))
          }
          promise = promise.then(process, process)
        }
      }
      return () => {
        if (status === STATUS_LOADING_SCANS && controllers.length > 0) {
          for (const controller of controllers) {
            controller.abort()
          }
        }
      }
    },
    [events, owners, status, processEvent, force, all]
  )

  useEffect(
    () => {
      if (status === STATUS_INITIAL) {
        if (Object.keys(events).length === Object.keys(owners).length) {
          resolveEnsNames(union(...Object.values(owners))).catch((err) => {
            console.error(err)
          })
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
                removeError(eventId)
                setLoadingCaching(eventId)
                putEventInCommon(eventId, inCommonProcessed).then(
                  () => {
                    updateEventCachedTs(eventId)
                    removeLoading(eventId)
                  },
                  (err) => {
                    console.error(err)
                    updateError(eventId, new Error('Could not cache drop', {
                      cause: err,
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
            addStaleEvent(eventId)
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
    removeError(eventId)
    loadCahedOwnersAndMetrics(eventId).catch((err) => {
      console.error(err)
    })
  }

  /**
   * @param {number} eventId
   * @param {string} address
   */
  const retryEventAddress = (eventId, address) => {
    setLoadingScans(eventId)
    enableProgress(eventId)
    removeEventOwnerError(eventId, address)
    processEventAddress(eventId, address).then(() => {
      if ((loadedCount[eventId] ?? 0) + 1 === owners[eventId].length) {
        disableProgress(eventId)
        removeLoading(eventId)
      }
    }).catch((err) => {
      console.error(err)
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
    const eventIds = parseEventIds(String(rawEventIds)).filter(
      (paramEventId) => String(paramEventId) !== String(eventId)
    )
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

  /**
   * @param {boolean} checked
   */
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
      all
    )
  }

  /**
   * @type {Record<number, { id: number; name: string; description?: string; image_url: string; original_url: string; city: string | null; country: string | null; start_date: string; end_date: string; expiry_date: string }>}
   */
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

  const sumCollectionsIncludes = () => {
    if (typeof metrics !== 'object') {
      return 0
    }
    return Object.values(metrics).reduce(
      (total, metric) => total + metric.collectionsIncludes,
      0
    )
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
                    <td className="event-cell-info">
                      <div className="event-image">
                        <TokenImageZoom
                          event={event}
                          zoomSize={512}
                          size={48}
                        />
                        <Link
                          to={`/event/${event.id}`}
                          className="event-id"
                        >
                          #{event.id}
                        </Link>
                      </div>
                      <div className="event-data">
                        <h2>{event.name}</h2>
                        <div className="event-date">
                          {formatDate(event.start_date)}
                        </div>
                        {event.city && event.country && (
                          <div className="place">
                            {event.city}, {event.country}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="event-cell-metrics">
                      {(status === STATUS_INITIAL || (event.id in loading && loading[event.id] === LOADING_OWNERS)) && !(event.id in owners) && (
                        <Loading small={true} />
                      )}
                      {event.id in owners && (
                        <ShadowText grow={true} medium={true}>
                          {formatStat(owners[event.id].length)}
                          {(
                            event.id in metrics &&
                            metrics[event.id] &&
                            metrics[event.id].emailReservations > 0
                          ) && ` + ${formatStat(metrics[event.id].emailReservations)}`}
                        </ShadowText>
                      )}
                    </td>
                    <td className="event-cell-status">
                      <Status
                        loading={
                          (
                            status === STATUS_INITIAL ||
                            event.id in loading
                          ) &&
                          loading[event.id] !== LOADING_CACHING &&
                          !(event.id in errors)
                        }
                        caching={
                          event.id in loading &&
                          loading[event.id] === LOADING_CACHING &&
                          !(event.id in errors)
                        }
                        error={
                          event.id in errors ||
                          (
                            event.id in eventOwnerErrors &&
                            !(
                              status === STATUS_INITIAL ||
                              event.id in loading
                            )
                          )
                        }
                      />
                      {event.id in errors && (
                        <>
                          <span
                            className="status-error-message"
                            title={errors[event.id].cause
                              ? `${errors[event.id].cause}`
                              : undefined}
                          >
                            {errors[event.id].message}
                          </span>
                          {' '}
                          <ButtonLink
                            onClick={() => retryLoadOwners(event.id)}
                          >
                            retry
                          </ButtonLink>
                        </>
                      )}
                    </td>
                    <td className="event-cell-progress">
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
                          <p key={address} className="address-error-message">
                            <code>[{address}]</code>{' '}
                            <span
                              title={error.cause ? `${error.cause}` : undefined}
                            >
                              {error.message}
                            </span>{' '}
                            <ButtonLink
                              onClick={() => {
                                retryEventAddress(event.id, address)
                              }}
                            >
                              retry
                            </ButtonLink>
                          </p>
                        )
                      )}
                      {event.id in eventData && eventData[event.id].ts != null && (
                        <p className="status-cached-ts">
                          Cached <Timestamp ts={eventData[event.id].ts} />
                          {(
                            !(event.id in loading) &&
                            event.id in eventData &&
                            event.id in eventData[event.id].inCommon &&
                            eventData[event.id].inCommon[event.id].length !== owners[event.id].length
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
                      <EventButtonGroup event={event} right={true}>
                        <ButtonDelete
                          onDelete={() => delEvent(event.id)}
                          title={`Removes drop #${event.id}`}
                        />
                      </EventButtonGroup>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
        {staleEvents && staleEvents.length > 0 && (
          <WarningMessage>
            There have been new mints in {staleEvents.length}{' '}
            POAP{staleEvents.length === 1 ? '' : 's'} since cached,{' '}
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
                    showEmpty={sumCollectionsIncludes() > 0}
                    emptyMessage={(
                      <>
                        No collections found that includes exactly all{' '}
                        {Object.keys(events).length} POAPs,{' '}
                        <ButtonLink onClick={handleViewAll}>
                          view related collections
                        </ButtonLink>.
                      </>
                    )}
                    collectionMap={{
                      [`${collectionData.collections.length} collections`]: collectionData.collections,
                      [`${collectionData.related.length} related collections`]: all ? collectionData.related : [],
                    }}
                  />
                )}
              </>
            )}
            <EventsOwners
              owners={owners}
              inCommon={inCommon}
              events={allEvents}
              all={all}
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
                  title={`Generates CSV file with collectors in common between drops #${eventId} and #${Object.keys(events).join(', #')}`}
                />,
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
