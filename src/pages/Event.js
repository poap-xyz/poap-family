import { useCallback, useContext, useEffect, useState } from 'react'
import { useLoaderData, useNavigate, useSearchParams } from 'react-router-dom'
import { formatStat } from '../utils/number'
import { formatDateAgo } from '../utils/date'
import { HTMLContext } from '../stores/html'
import { SettingsContext } from '../stores/cache'
import { ReverseEnsContext } from '../stores/ethereum'
import { scanAddress } from '../loaders/poap'
import { getInCommonEventsWithProgress, patchEvents, putEventInCommon } from '../loaders/api'
import { filterCacheEventsByInCommonEventIds, parseEventIds } from '../models/event'
import { filterAndSortInCommonEntries } from '../models/in-common'
import Timestamp from '../components/Timestamp'
import Page from '../components/Page'
import Card from '../components/Card'
import Button from '../components/Button'
import Loading from '../components/Loading'
import InCommon from '../components/InCommon'
import EventInfo from '../components/EventInfo'
import AddressErrorList from '../components/AddressErrorList'
import WarningMessage from '../components/WarningMessage'
import ButtonLink from '../components/ButtonLink'
import Progress from '../components/Progress'
import ButtonExportAddressCsv from '../components/ButtonExportAddressCsv'
import ButtonAdd from '../components/ButtonAdd'
import ButtonExpand from '../components/ButtonExpand'
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
  const [loading, setLoading] = useState(false)
  const [loadedCount, setLoadedCount] = useState(0)
  const [loadedProgress, setLoadedProgress] = useState(null)
  const [errors, setErrors] = useState([])
  const [caching, setCaching] = useState(false)
  const [cachingError, setCachingError] = useState(null)

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
          filterAndSortInCommonEntries(
            Object.entries(inCommon)
          )
        )
        const inCommonProcessedEventIds = Object.keys(inCommonProcessed)
        if (inCommonProcessedEventIds.length > 0) {
          const eventsProcessed = filterCacheEventsByInCommonEventIds(
            events,
            inCommonProcessedEventIds
          )
          setCaching(true)
          setCachingError(null)
          Promise
          .all([
            patchEvents(Object.values(eventsProcessed)),
            putEventInCommon(event.id, inCommonProcessed),
          ])
          .then(
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
                  There has been new mints since this POAP was cached,{' '}
                  <ButtonLink onClick={() => refreshCache()}>refresh</ButtonLink>.
                </WarningMessage>
              )}
              {errors.length > 0 && (
                <Card>
                  <AddressErrorList errors={errors} onRetry={retryAddress} />
                </Card>
              )}
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
            </>
        }
      </div>
    </Page>
  )
}

export default Event
