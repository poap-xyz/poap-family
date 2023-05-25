import { useCallback, useContext, useEffect, useState } from 'react'
import { Link, useLoaderData, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { formatStat } from '../utils/number'
import { HTMLContext } from '../stores/html'
import { ReverseEnsContext } from '../stores/ethereum'
import { getEventMetrics, getEventsMetrics, getEventsOwners, getInCommonEventsWithProgress, patchEvents, putEventInCommon, putEventOwners } from '../loaders/api'
import { fetchPOAPs, scanAddress } from '../loaders/poap'
import { filterAndSortInCommon, mergeEventsInCommon } from '../models/in-common'
import { filterCacheEventsByInCommonEventIds, parseEventIds, parseExpiryDates } from '../models/event'
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
import EventsOwners from '../components/EventsOwners'
import Button from '../components/Button'
import Switch from '../components/Switch'
import WarningIcon from '../components/WarningIcon'
import WarningMessage from '../components/WarningMessage'
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
  const events = useLoaderData()
  const { eventIds: rawEventIds } = useParams()
  const [searchParams, setSearchParams] = useSearchParams({ all: false })
  const { setTitle } = useContext(HTMLContext)
  const { resolveEnsNames } = useContext(ReverseEnsContext)
  const [owners, setOwners] = useState({})
  const [metrics, setMetrics] = useState({})
  const [status, setStatus] = useState(STATUS_INITIAL)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState({})
  const [eventData, setEventData] = useState({})
  const [eventOwnerErrors, setEventOwnerErrors] = useState({})
  const [loadedCount, setLoadedCount] = useState({})
  const [loadedProgress, setLoadedProgress] = useState({})
  const [progress, setProgress] = useState({})
  const [staleEvents, setStaleEvents] = useState([])

  const removeLoading = (eventId) => {
    setLoading((alsoLoading) => {
      const newLoading = {}
      for (const [loadingEventId, isLoading] of Object.entries(alsoLoading)) {
        if (String(eventId) !== String(loadingEventId)) {
          newLoading[loadingEventId] = isLoading
        }
      }
      return newLoading
    })
  }

  const removeProgress = (eventId) => {
    setLoadedProgress((alsoProgress) => {
      const newProgress = {}
      for (const [loadingEventId, progress] of Object.entries(alsoProgress)) {
        if (String(eventId) !== String(loadingEventId)) {
          newProgress[loadingEventId] = progress
        }
      }
      return newProgress
    })
  }

  const loadOwners = useCallback(
    (eventId, abortSignal) => {
      if (eventId in owners) {
        return Promise.resolve()
      }
      setLoading((alsoLoading) => ({ ...alsoLoading, [eventId]: LOADING_OWNERS }))
      return fetchPOAPs(eventId, abortSignal).then(
        (eventOwnerTokens) => {
          removeLoading(eventId)
          if (eventOwnerTokens) {
            const newOwners = [...new Set(eventOwnerTokens.map((token) => token.owner.id))]
            setOwners((prevOwners) => ({ ...prevOwners, [eventId]: newOwners }))
            putEventOwners(eventId, newOwners)
            return Promise.resolve()
          }
          return Promise.reject(new Error(`Tokens for drop '${eventId}' missing`))
        },
        (err) => {
          removeLoading(eventId)
          if (!err.aborted) {
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
    (eventId, abortSignal) => {
      if (eventId in owners) {
        return Promise.resolve()
      }
      setLoading((alsoLoading) => ({ ...alsoLoading, [eventId]: LOADING_OWNERS }))
      return Promise.allSettled([
        fetchPOAPs(eventId, abortSignal),
        getEventMetrics(eventId, abortSignal, searchParams.get('force') === 'true'),
      ]).then(
        ([eventOwnerTokensResult, eventMetricsResult]) => {
          removeLoading(eventId)
          if (eventOwnerTokensResult.status === 'fulfilled') {
            const eventOwnerTokens = eventOwnerTokensResult.value
            if (Array.isArray(eventOwnerTokens)) {
              const newOwners = [...new Set(eventOwnerTokens.map((token) => token.owner.id))]
              setOwners((prevOwners) => ({ ...prevOwners, [eventId]: newOwners }))
              putEventOwners(eventId, newOwners)
            } else {
              return Promise.reject(new Error(`Tokens for drop '${eventId}' missing`))
            }
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
          if (!err.aborted) {
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
    (eventId, address, abortSignal) => scanAddress(address, abortSignal).then(
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
        if (!err.aborted) {
          return Promise.reject(err)
        }
        return Promise.resolve()
      }
    ),
    []
  )

  const processEvent = useCallback(
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
          setProgress((alsoProgress) => {
            const newProgress = {}
            for (const [progressEventId, isProgress] of Object.entries(alsoProgress)) {
              if (String(eventId) !== String(progressEventId)) {
                newProgress[progressEventId] = isProgress
              }
            }
            return newProgress
          })
          removeLoading(eventId)
        },
        (err) => {
          if (!err.aborted) {
            console.error(err)
          }
        }
      )
      return promise
    },
    [owners, processEventAddress]
  )

  useEffect(
    () => {
      setTitle(Object.values(events).map((event) => event.name).join(', '))
    },
    [events, setTitle]
  )

  useEffect(
    () => {
      const eventIds = Object.keys(events)
      const requests = []
      const force = searchParams.get('force') === 'true'
      if (status === STATUS_INITIAL) {
        if (!force) {
          const controller = new AbortController()
          const expiryDates = parseExpiryDates(events)
          Promise.all([
            getEventsOwners(eventIds, controller.signal, expiryDates),
            getEventsMetrics(eventIds, controller.signal),
          ]).then(
            ([newOwners, eventsMetrics]) => {
              if (eventsMetrics) {
                setMetrics((oldReservations) => ({ ...oldReservations, ...eventsMetrics }))
              }
              if (newOwners) {
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
            () => force ? loadOwnersAndMetrics(eventId, controller.signal) : loadOwners(eventId, controller.signal),
            () => force ? loadOwnersAndMetrics(eventId, controller.signal) : loadOwners(eventId, controller.signal)
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
    [events, status, loadOwners, loadOwnersAndMetrics, resolveEnsNames, searchParams]
  )

  useEffect(
    () => {
      const eventIds = Object.keys(events)
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
              /*onProgress*/({ loaded, total, progress, bytes, estimated, rate }) => {
                setLoadedProgress((alsoProgress) => ({ ...alsoProgress, [eventId]: { progress, estimated, rate } }))
              }
            ).then(
              (result) => {
                removeProgress(eventId)
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
                removeProgress(eventId)
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
        const eventIds = Object.keys(events)
        let eventsLoaded = 0
        for (const eventId of eventIds) {
          if ((loadedCount[eventId] ?? 0) === owners[eventId].length) {
            eventsLoaded++
            if (eventId in eventData && !eventData[eventId].ts && !(eventId in errors) && !(eventId in loading)) {
              const inCommonProcessed = Object.fromEntries(
                filterAndSortInCommon(
                  Object.entries(eventData[eventId].inCommon)
                )
              )
              const inCommonProcessedEventIds = Object.keys(inCommonProcessed)
              if (inCommonProcessedEventIds.length > 0) {
                const eventsProcessed = filterCacheEventsByInCommonEventIds(
                  eventData[eventId].events,
                  inCommonProcessedEventIds
                )
                setLoading((alsoLoading) => ({ ...alsoLoading, [eventId]: LOADING_CACHING }))
                Promise
                .all([
                  patchEvents(Object.values(eventsProcessed)),
                  putEventInCommon(eventId, inCommonProcessed),
                ])
                .then(
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
                    const error = new Error('Could not cache drop')
                    error.reason = err
                    console.error(err)
                    setErrors((prevErrors) => ({
                      ...prevErrors,
                      [eventId]: error,
                    }))
                    removeLoading(eventId)
                  }
                )
              }
            }
          } else if (!(eventId in loading) && eventId in eventData && eventId in eventData[eventId].inCommon && eventData[eventId].inCommon[eventId].length < owners[eventId].length) {
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

  const retryLoadOwners = (eventId) => {
    setErrors((prevErrors) => {
      const newErrors = {}
      for (const [errorEventId, error] of Object.entries(prevErrors)) {
        if (String(errorEventId) !== String(eventId)) {
          newErrors[errorEventId] = error
        }
      }
      return newErrors
    })
    loadOwners(eventId)
  }

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
        setProgress((alsoProgress) => {
          const newProgress = {}
          for (const [progressEventId, isProgress] of Object.entries(alsoProgress)) {
            if (String(eventId) !== String(progressEventId)) {
              newProgress[progressEventId] = isProgress
            }
          }
          return newProgress
        })
        removeLoading(eventId)
      }
    })
  }

  const addEvent = (eventId) => {
    navigate(`/events/${parseEventIds(`${rawEventIds},${eventId}`).join(',')}`)
  }

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

  const addEvents = (eventIds) => {
    if (eventIds.length === 0) {
      return
    }
    const newEventIds = parseEventIds(`${rawEventIds},${eventIds.join(',')}`)
    if (newEventIds.length > 0) {
      navigate(`/events/${newEventIds.join(',')}`)
    }
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

  const handleAllChange = (event) => {
    setSearchParams({ all: event.target.checked })
  }

  let inCommon = {}
  if (status === STATUS_LOADING_COMPLETE) {
    inCommon = mergeEventsInCommon(eventData, searchParams.get('all') === 'true')
  }

  const allEvents = Object.values(eventData).reduce(
    (allEvents, data) => ({ ...allEvents, ...data.events }),
    {}
  )

  const refreshCache = () => {
    setSearchParams({ force: true })
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
                      onChange={handleAllChange}
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
                          <div className="event-date">{event.start_date}</div>
                          {event.city && event.country && <div className="place">{event.city}, {event.country}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="event-cell-owners">
                      {(status === STATUS_INITIAL || (event.id in loading && loading[event.id] === LOADING_OWNERS)) && !(event.id in owners) && (
                        <Loading small={true} />
                      )}
                      {event.id in owners && (
                        <ShadowText grow={true} small={true}>
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
                              title={errors[event.id].reason ? `${errors[event.id].reason}` : undefined}
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
                          {!(event.id in loading) && event.id in eventData && event.id in eventData[event.id].inCommon && eventData[event.id].inCommon[event.id].length < owners[event.id].length && (
                            <>{' '}<WarningIcon title="There has been new mints since this POAP was cached" /></>
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
                            secondary={true}
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
            There has been new mints in {staleEvents.length} POAP{staleEvents.length === 1 ? '' : 's'} since cached,{' '}
            <ButtonLink onClick={() => refreshCache()}>refresh all</ButtonLink>.
          </WarningMessage>
        )}
        {status === STATUS_LOADING_COMPLETE && (
          <>
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
                  secondary={true}
                  borderless={true}
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
