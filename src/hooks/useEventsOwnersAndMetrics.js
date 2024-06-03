import { useCallback, useState } from 'react'
import { filterInvalidOwners } from 'models/address'
import { AbortedError } from 'models/error'
import { fetchPOAPs } from 'loaders/poap'
import {
  getEventAndOwners,
  getEventMetrics,
  getEventsMetrics,
  getEventsOwners,
} from 'loaders/api'

/**
 * @param {number[]} eventIds
 * @param {Record<number, Date>} expiryDates
 * @param {boolean} [force]
 * @returns {{
 *   completedEventsOwnersAndMetrics: boolean
 *   loadingEventsOwnersAndMetrics: boolean
 *   loadingOwnersAndMetricsEvents: Record<number, boolean>
 *   eventsOwnersAndMetricsErrors: Record<number, Error>
 *   eventsOwners: Record<number, string[]>
 *   eventsMetrics: Record<number, { emailReservations: number; emailClaimsMinted: number; emailClaims: number; momentsUploaded: number; collectionsIncludes: number; ts: number }>
 *   fetchEventsOwnersAndMetrics: () => () => void
 *   retryEventOwnersAndMetrics: (eventId: number) => () => void
 * }}
 */
function useEventsOwnersAndMetrics(eventIds, expiryDates, force = false) {
  /**
   * @type {ReturnType<typeof useState<boolean>>}
   */
  const [completed, setCompleted] = useState(false)
  /**
   * @type {ReturnType<typeof useState<boolean>>}
   */
  const [loadingCache, setLoadingCache] = useState(false)
  /**
   * @type {ReturnType<typeof useState<Record<number, boolean>>>}
   */
  const [loading, setLoading] = useState({})
  /**
   * @type {ReturnType<typeof useState<Record<number, Error>>>}
   */
  const [errors, setErrors] = useState({})
  /**
   * @type {ReturnType<typeof useState<Record<number, string[]>>>}
   */
  const [owners, setOwners] = useState({})
  /**
   * @type {ReturnType<typeof useState<Record<number, { emailReservations: number; emailClaimsMinted: number; emailClaims: number; momentsUploaded: number; collectionsIncludes: number; ts: number }>>>}
   */
  const [metrics, setMetrics] = useState({})

  /**
   * @param {number} eventId
   */
  const addLoading = (eventId) => {
    setLoading((alsoLoading) => ({
      ...alsoLoading,
      [eventId]: true,
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
       * @type {Record<number, boolean>}
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
   * @param {Error} err
   */
  const addError = (eventId, err) => {
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
        Object.entries(eventsOwners)
          .filter(([, eventOwners]) => eventOwners != null)
          .map(
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
    setMetrics((prevMetrics) => ({
      ...prevMetrics,
      ...Object.fromEntries(
        Object.entries(eventsMetrics).filter(([, metrics]) => metrics != null)
      ),
    }))
  }

  const loadCachedOwnersAndMetrics = useCallback(
    /**
     * @param {number} eventId
     * @param {AbortSignal} [abortSignal]
     */
    async (eventId, abortSignal) => {
      removeError(eventId)
      addLoading(eventId)
      let eventAndOwners
      try {
        eventAndOwners = await getEventAndOwners(
          eventId,
          abortSignal,
          /*includeDescription*/false,
          /*includeMetrics*/true,
          /*refresh*/false
        )
      } catch (err) {
        removeLoading(eventId)
        if (!(err instanceof AbortedError)) {
          addError(eventId, new Error(
            'Could not fetch drop and collectors',
            { cause: err }
          ))
        }
        return
      }
      removeLoading(eventId)
      if (eventAndOwners != null) {
        updateEventOwners(eventId, eventAndOwners.owners)
        if (eventAndOwners.metrics) {
          updateEventMetrics(eventId, eventAndOwners.metrics)
        }
      } else {
        addError(
          eventId,
          new Error('Could not fetch drop and collectors')
        )
      }
    },
    []
  )

  const loadOwnersAndMetrics = useCallback(
    /**
     * @param {number} eventId
     * @param {AbortSignal} [abortSignal]
     */
    async (eventId, abortSignal) => {
      removeError(eventId)
      addLoading(eventId)
      let eventOwnerTokensResult
      let eventMetricsResult
      try {
        [eventOwnerTokensResult, eventMetricsResult] = await Promise.allSettled([
          fetchPOAPs(eventId, abortSignal),
          getEventMetrics(eventId, abortSignal, force),
        ])
      } catch (err) {
        removeLoading(eventId)
        if (!(err instanceof AbortedError)) {
          addError(
            eventId,
            new Error('Could not fetch collectors or metrics', {
              cause: err,
            })
          )
        }
        return
      }
      removeLoading(eventId)
      if (eventOwnerTokensResult.status === 'fulfilled') {
        updateEventOwners(
          eventId,
          eventOwnerTokensResult.value.map((token) => token.owner)
        )
      } else {
        if (!(eventOwnerTokensResult.reason instanceof AbortedError)) {
          console.error(eventOwnerTokensResult.reason)
          addError(
            eventId,
            new Error(`Tokens for drop '${eventId}' failed to fetch`, {
              cause: eventOwnerTokensResult.reason,
            })
          )
        }
      }
      if (eventMetricsResult.status === 'fulfilled') {
        if (eventMetricsResult.value) {
          updateEventMetrics(eventId, eventMetricsResult.value)
        }
      } else {
        if (!(eventMetricsResult.reason instanceof AbortedError)) {
          console.error(eventMetricsResult.reason)
        }
      }
    },
    [force]
  )

  const fetchEventsOwnersAndMetrics = useCallback(
    () => {
      /**
       * @type {AbortController | undefined}
       */
      let controller
      /**
       * @type {Record<number, AbortController>}
       */
      const controllers = eventIds.reduce(
        (ctrls, eventId) => ({
          ...ctrls,
          [eventId]: new AbortController(),
        }),
        {}
      )
      setCompleted(false)
      setLoadingCache(false)
      setLoading({})
      setErrors({})
      setOwners({})
      setMetrics({})
      if (force) {
        let promise = new Promise((r) => { r(undefined) })
        for (const eventId of eventIds) {
          promise = promise.then(
            () => loadOwnersAndMetrics(eventId, controllers[eventId].signal)
          )
        }
        promise.finally(() => {
          setCompleted(true)
        })
      } else {
        setLoadingCache(true)
        controller = new AbortController()
        Promise.all([
          getEventsOwners(eventIds, controller.signal, expiryDates),
          getEventsMetrics(eventIds, controller.signal, expiryDates),
        ]).then(([eventsOwners, eventsMetrics]) => {
          updateEventsOwners(
            Object.fromEntries(
              Object.entries(eventsOwners).map(
                ([rawEventId, eventOwners]) => [
                  rawEventId,
                  eventOwners.owners,
                ]
              )
            )
          )
          updateEventsMetrics(eventsMetrics)
          setLoadingCache(false)
          setCompleted(true)
        }).catch((err) => {
          setLoadingCache(false)
          if (err instanceof AbortedError) {
            setCompleted(true)
          } else {
            console.error(err)
            let promise = new Promise((r) => { r(undefined) })
            for (const eventId of eventIds) {
              promise = promise.then(() => force
                ? loadOwnersAndMetrics(eventId, controllers[eventId].signal)
                : loadCachedOwnersAndMetrics(eventId, controllers[eventId].signal))
            }
            promise.finally(() => {
              setCompleted(true)
            })
          }
        })
      }
      return () => {
        if (controller) {
          controller.abort()
        }
        for (const controller of Object.values(controllers)) {
          controller.abort()
        }
        setCompleted(false)
        setLoading({})
        setErrors({})
        setOwners({})
        setMetrics({})
      }
    },
    [
      eventIds,
      expiryDates,
      force,
      loadCachedOwnersAndMetrics,
      loadOwnersAndMetrics,
    ]
  )

  /**
   * @param {number} eventId
   */
  const retryEventOwnersAndMetrics = (eventId) => {
    removeError(eventId)
    const controller = new AbortController()
    loadCachedOwnersAndMetrics(eventId, controller.signal)
    return () => {
      controller.abort()
    }
  }

  return {
    completedEventsOwnersAndMetrics: completed,
    loadingEventsOwnersAndMetrics: loadingCache,
    loadingOwnersAndMetricsEvents: loading,
    eventsOwnersAndMetricsErrors: errors,
    eventsOwners: owners,
    eventsMetrics: metrics,
    fetchEventsOwnersAndMetrics,
    retryEventOwnersAndMetrics,
  }
}

export default useEventsOwnersAndMetrics
