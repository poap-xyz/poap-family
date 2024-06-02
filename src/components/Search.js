import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAnalytics } from 'stores/analytics'
import { useSettings } from 'stores/settings'
import { searchEvents } from 'loaders/event'
import { searchCollections } from 'loaders/collection'
import { joinEventIds, parseEventIds, SEARCH_LIMIT } from 'models/event'
import { resizeCollectionImageUrl } from 'models/collection'
import useEvent from 'hooks/useEvent'
import Card from 'components/Card'
import TokenImage from 'components/TokenImage'
import Pagination from 'components/Pagination'
import 'styles/search.css'

function Search() {
  const navigate = useNavigate()
  const { trackSiteSearch } = useAnalytics()
  const { settings } = useSettings()
  /**
   * @type {ReturnType<typeof useRef<HTMLInputElement>>}
   */
  const queryRef = useRef()
  /**
   * @type {ReturnType<typeof useState<{ query: string | null; state: boolean; controller: AbortController | null }>>}
   */
  const [loadingSearch, setLoadingSearch] = useState({
    query: null,
    state: false,
    controller: null,
  })
  /**
   * @type {ReturnType<typeof useState<{ query: string | null; state: boolean; controller: AbortController | null }>>}
   */
  const [loadingSearchCollections, setLoadingSearchCollections] = useState({
    query: null,
    state: false,
    controller: null,
  })
  /**
   * @type {ReturnType<typeof useState<NodeJS.Timeout | null>>}
   */
  const [timeoutId, setTimeoutId] = useState(null)
  /**
   * @type {ReturnType<typeof useState<Error | null>>}
   */
  const [errorSearch, setErrorSearch] = useState(null)
  /**
   * @type {ReturnType<typeof useState<Error | null>>}
   */
  const [errorSearchCollections, setErrorSearchCollections] = useState(null)
  /**
   * @type {ReturnType<typeof useState<Error | null>>}
   */
  const [errorSubmit, setErrorSubmit] = useState(null)
  /**
   * @type {ReturnType<typeof useState<Array<{ id: number; name: string; description?: string; image_url: string; original_url: string; city: string | null; country: string | null; start_date: string; end_date: string; expiry_date: string }>>>}
   */
  const [queryEvents, setQueryEvents] = useState([])
  /**
   * @type {ReturnType<typeof useState<Array<{ id: number; slug: string; title: string | null; banner_image_url: string | null; logo_image_url: string | null; dropIds: number[] }>>>}
   */
  const [queryCollections, setQueryCollections] = useState([])
  /**
   * @type {ReturnType<typeof useState<number | null>>}
   */
  const [queryTotal, setQueryTotal] = useState(null)
  /**
   * @type {ReturnType<typeof useState<number | null>>}
   */
  const [queryTotalCollections, setQueryTotalCollections] = useState(null)
  /**
   * @type {ReturnType<typeof useState<number>>}
   */
  const [queryPage, setQueryPage] = useState(1)
  /**
   * @type {ReturnType<typeof useState<Array<{ id: number; name: string; description?: string; image_url: string; original_url: string; city: string | null; country: string | null; start_date: string; end_date: string; expiry_date: string }>>>}
   */
  const [selectedEvents, setSelectedEvents] = useState([])
  /**
   * @type {ReturnType<typeof useState<Array<{ id: number; slug: string; title: string | null; banner_image_url: string | null; logo_image_url: string | null; dropIds: number[] }>>>}
   */
  const [selectedCollections, setSelectedCollections] = useState([])

  const {
    loading: loadingById,
    error: errorById,
    event: eventById,
    findEvent,
    cancelEvent,
    retryEvent,
  } = useEvent()

  useEffect(
    () => () => {
      if (loadingSearchCollections.state) {
        loadingSearchCollections.controller.abort()
      }
      if (loadingSearch.state) {
        loadingSearch.controller.abort()
      }
      cancelEvent()
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    },
    [] // eslint-disable-line react-hooks/exhaustive-deps
  )

  /**
   * @param {string} value
   * @param {number} page
   */
  const search = (value, page = 1) => {
    setQueryPage(page)
    setErrorSearch(null)
    setQueryEvents([])
    setQueryTotal(null)
    const offset = (page - 1) * SEARCH_LIMIT
    if (queryTotal == null || offset <= queryTotal) {
      const controller = new AbortController()
      setLoadingSearch({
        query: value,
        state: true,
        controller,
      })
      searchEvents(value, controller.signal, offset, SEARCH_LIMIT).then(
        (results) => {
          if (page === 1) {
            trackSiteSearch({
              category: 'drops',
              keyword: value,
              count: results.total,
            })
          }
          setLoadingSearch({ query: null, state: false, controller: null })
          if (queryRef.current && String(value) === queryRef.current.value) {
            setQueryEvents(results.items)
            setQueryTotal(results.total)

            if (results.total === 0 || results.items.length === 0) {
              setErrorSearch(new Error('No drops results for query'))
            }
            if (results.total === 1 && results.items.length === 1) {
              setSelectedEvents(results.items)
            }
          }
        },
        (err) => {
          if (err.code !== 20) {
            console.error(err)
            if (err instanceof Error) {
              setErrorSearch(err)
            }
          }
          setLoadingSearch({
            query: null,
            state: false,
            controller: null,
          })
        }
      )
    }
    setErrorSearchCollections(null)
    setQueryCollections([])
    setQueryTotalCollections(0)
    if (
      settings.showCollections && (
        queryTotalCollections == null ||
        offset <= queryTotalCollections
      )
    ) {
      const controller = new AbortController()
      setLoadingSearchCollections({
        query: value,
        state: true,
        controller,
      })
      searchCollections(value, offset, SEARCH_LIMIT, controller.signal).then(
        (results) => {
          if (page === 1) {
            trackSiteSearch({
              category: 'collections',
              keyword: value,
              count: results.total == null ? undefined : results.total,
            })
          }
          setLoadingSearchCollections({
            query: null,
            state: false,
            controller: null,
          })
          if (queryRef.current && String(value) === queryRef.current.value) {
            setQueryCollections(results.items)
            if (results.total) {
              setQueryTotalCollections(results.total)
            } else {
              setQueryTotalCollections(0)
            }
          }
        },
        (err) => {
          if (err.code !== 20) {
            console.error(err)
            if (err instanceof Error) {
              setErrorSearchCollections(err)
            }
          }
          setLoadingSearchCollections({
            query: null,
            state: false,
            controller: null,
          })
        }
      )
    }
  }

  function onSearch() {
    if (selectedEvents.length === 1 && selectedCollections.length === 0) {
      navigate(`/event/${selectedEvents[0].id}`)
      return
    }
    if (selectedEvents.length === 0 && selectedCollections.length === 1) {
      navigate(`/events/${joinEventIds(selectedCollections[0].dropIds)}`)
      return
    }
    const newEventIds = []
    if (selectedEvents.length > 0) {
      for (const selectedEvent of selectedEvents) {
        newEventIds.push(selectedEvent.id)
      }
    }
    if (selectedCollections.length > 0) {
      for (const selectedCollection of selectedCollections) {
        newEventIds.push(...selectedCollection.dropIds)
      }
    }
    if (newEventIds.length > 0) {
      navigate(`/events/${joinEventIds(newEventIds)}`)
      return
    }
    if (eventById) {
      navigate(`/event/${eventById.id}`)
      return
    }
    const value = queryRef.current ? String(queryRef.current.value).trim() : ''
    if (/^[0-9]+$/.test(value)) {
      navigate(`/event/${value}`)
      return
    }
    if (value.startsWith('#')) {
      const subValue = value.substring(1)
      if (/^[0-9]+$/.test(subValue)) {
        navigate(`/event/${subValue}`)
        return
      }
    }
    if (/^[0-9]+(, *[0-9]+)*$/.test(value)) {
      const rawEventIds = parseEventIds(value)
      if (rawEventIds.length > 0) {
        navigate(`/events/${joinEventIds(rawEventIds)}`)
        return
      }
    }
    if (queryCollections.length > 0 || queryEvents.length > 0) {
      setErrorSubmit(new Error('Select any POAP drop to continue'))
    } else if (value.length === 0) {
      setErrorSubmit(new Error('Search and select any POAP drop to continue'))
    }
  }

  /**
   * @param {number} keyCode
   */
  function onQueryKeyUp(keyCode) {
    if (keyCode === 13) { // [Enter]
      onSearch()
    }
  }

  function onQueryChange() {
    const value = queryRef.current ? String(queryRef.current.value).trim() : ''
    if (loadingSearchCollections.state) {
      loadingSearchCollections.controller.abort()
    }
    if (loadingSearch.state) {
      loadingSearch.controller.abort()
    }
    cancelEvent()
    if (timeoutId) {
      clearTimeout(timeoutId)
      setTimeoutId(null)
    }
    if (value.length > 0) {
      setTimeoutId(setTimeout(
        () => {
          search(value, 1)
          if (/^[0-9]+$/.test(value)) {
            const eventId = parseInt(value)
            if (!isNaN(eventId)) {
              findEvent(eventId)
            }
          }
        },
        750
      ))
    } else {
      setErrorSearch(null)
      setErrorSubmit(null)
      setQueryEvents([])
      setQueryCollections([])
      setQueryTotal(null)
      setQueryPage(1)
      setLoadingSearch({
        query: null,
        state: false,
        controller: null,
      })
      setLoadingSearchCollections({
        query: null,
        state: false,
        controller: null,
      })
    }
  }

  /**
   * @param {number} eventId
   * @param {boolean} checked
   */
  function onSelectEventChange(eventId, checked) {
    if (checked) {
      const event = queryEvents.find((queried) => queried.id === eventId)
      if (event) {
        setSelectedEvents((prevSelectedEvents) => {
          const exists = -1 !== prevSelectedEvents.findIndex(
            (prevSelectedEvent) => prevSelectedEvent.id === event.id
          )
          if (exists) {
            return prevSelectedEvents
          }
          return [...prevSelectedEvents, event]
        })
      } else if (eventById) {
        setSelectedEvents((prevSelectedEvents) => {
          const exists = -1 !== prevSelectedEvents.findIndex(
            (prevSelectedEvent) => prevSelectedEvent.id === eventById.id
          )
          if (exists) {
            return prevSelectedEvents
          }
          return [...prevSelectedEvents, eventById]
        })
      }
    } else {
      const selectedIndex = selectedEvents.findIndex(
        (selected) => selected.id === eventId
      )
      if (selectedIndex !== -1) {
        setSelectedEvents((prevSelectedEvents) => {
          const newSelectedEvents = [...prevSelectedEvents]
          newSelectedEvents.splice(selectedIndex, 1)
          return newSelectedEvents
        })
      }
    }
    retryEvent()
    setErrorSearchCollections(null)
    setErrorSearch(null)
    setErrorSubmit(null)
  }

  /**
   * @param {number} collectionId
   * @param {boolean} checked
   */
  function onSelectCollectionChange(collectionId, checked) {
    if (checked) {
      const collection = queryCollections.find(
        (queried) => queried.id === collectionId
      )
      if (collection) {
        setSelectedCollections((prevSelectedCollections) => {
          const exists = -1 !== prevSelectedCollections.findIndex(
            (prevSelectedCollection) => prevSelectedCollection.id === collection.id
          )
          if (exists) {
            return prevSelectedCollections
          }
          return [...prevSelectedCollections, collection]
        })
      }
    } else {
      const selectedIndex = selectedCollections.findIndex(
        (selected) => selected.id === collectionId
      )
      if (selectedIndex !== -1) {
        setSelectedCollections((prevSelectedCollections) => {
          const newSelectedCollections = [...prevSelectedCollections]
          newSelectedCollections.splice(selectedIndex, 1)
          return newSelectedCollections
        })
      }
    }
    retryEvent()
    setErrorSearchCollections(null)
    setErrorSearch(null)
    setErrorSubmit(null)
  }

  /**
   * @param {{ id: number; name: string; description?: string; image_url: string; original_url: string; city: string | null; country: string | null; start_date: string; end_date: string; expiry_date: string }} event
   */
  const renderEvent = (event) => (
    <div className="drop-preview" key={event.id}>
      <div className="drop-info">
        <div className="drop-image">
          <Link to={`/event/${event.id}`} className="drop-link">
            <TokenImage event={event} size={18} />
          </Link>
        </div>
        <div className="drop-name">
          <h4 title={event.name}>{event.name}</h4>
        </div>
        <div className="drop-select">
          <input
            type="checkbox"
            checked={-1 !== selectedEvents.findIndex(
              (selected) => selected.id === event.id
            )}
            onChange={(changeEvent) => {
              onSelectEventChange(
                event.id,
                changeEvent.target.checked
              )
            }}
          />
        </div>
      </div>
    </div>
  )

  /**
   * @param {{ id: number; slug: string; title: string | null; banner_image_url: string | null; logo_image_url: string | null; dropIds: number[] }} collection
   */
  const renderCollection = (collection) => (
    <div className="collection-preview" key={collection.id}>
      {collection.banner_image_url && (
        <div className="collection-banner">
          <img
            src={resizeCollectionImageUrl(collection.banner_image_url, {
              w: 480,
              h: 40,
            })}
            alt=""
          />
        </div>
      )}
      <div className="collection-info">
        <div className="collection-logo">
          {collection.logo_image_url && (
            <Link
              to={`/events/${joinEventIds(collection.dropIds)}`}
              className="collection-link"
            >
              <img
                src={resizeCollectionImageUrl(collection.logo_image_url, {
                  w: 18,
                  h: 18,
                })}
                alt=""
              />
            </Link>
          )}
        </div>
        <div className="collection-title">
          <h4 title={collection.title}>{collection.title}</h4>
          <div className="collection-count">
            <span>{collection.dropIds.length}</span>
          </div>
        </div>
        <div className="collection-select">
          <input
            type="checkbox"
            checked={-1 !== selectedCollections.findIndex(
              (selected) => selected.id === collection.id
            )}
            onChange={(changeEvent) => {
              onSelectCollectionChange(
                collection.id,
                changeEvent.target.checked
              )
            }}
          />
        </div>
      </div>
    </div>
  )

  const selectedEventById = eventById && -1 !== selectedEvents.findIndex(
    (selected) => eventById.id === selected.id
  )
  const selectedNotInEvents = selectedEvents.filter(
    (selected) => -1 === queryEvents.findIndex(
      (queried) => queried.id === selected.id
    )
  )
  const selectedNotInCollections = selectedCollections.filter(
    (selected) => -1 === queryCollections.findIndex(
      (queried) => queried.id === selected.id
    )
  )
  const selectedCollectionsTotalDrops = selectedCollections.reduce(
    (total, collection) => total + collection.dropIds.length,
    0
  )

  const maxTotal = Math.max(queryTotal, queryTotalCollections)
  const pages = Math.ceil(maxTotal / SEARCH_LIMIT)

  /**
   * @param {number} newPage
   */
  const onPageChange = (newPage) => {
    const value = queryRef.current ? queryRef.current.value : ''
    if (value.length > 0) {
      search(value, newPage)
    }
  }

  const isLoading = (
    loadingById ||
    loadingSearch.state ||
    loadingSearchCollections.state
  )

  return (
    <div className="search">
      <Card>
        <form
          role="search"
          onSubmit={(event) => {
            event.preventDefault()
            onSearch()
          }}
        >
          <div className="search-form">
            <input
              ref={queryRef}
              className="query"
              type="search"
              name="query"
              placeholder="Search POAPs"
              onChange={() => onQueryChange()}
              onKeyUp={(event) => onQueryKeyUp(event.keyCode)}
              autoComplete="off"
              maxLength={256}
              size={24}
            />
            <input
              className="go"
              type="submit"
              value="Find POAPs In Common"
              disabled={!eventById &&
                selectedEvents.length === 0 &&
                selectedCollections.length === 0}
            />
          </div>
        </form>
        {(
          !errorById &&
          !errorSearch &&
          !errorSearchCollections &&
          !errorSubmit &&
          selectedEvents.length === 0 &&
          selectedCollections.length === 0 &&
          queryEvents.length === 0 &&
          queryCollections.length === 0 &&
          !isLoading &&
          !eventById
        ) && (
          <div className="search-options">
            <Link className="link" to="/addresses">
              manually enter collections
            </Link>
          </div>
        )}
        {errorById && queryEvents.length === 0 && queryCollections.length === 0 && (
          <div className="search-error">
            <p>{errorById.message}</p>
          </div>
        )}
        {errorSearch && !eventById && (
          <div className="search-error">
            <p>{errorSearch.message}</p>
          </div>
        )}
        {errorSearchCollections && !eventById && (
          <div className="search-error">
            <p>{errorSearchCollections.message}</p>
          </div>
        )}
        {errorSubmit && (
          <div className="search-error">
            <p>{errorSubmit.message}</p>
          </div>
        )}
        {(
          selectedEvents.length > 0 ||
          selectedCollections.length > 0 ||
          queryEvents.length > 0 ||
          queryCollections.length > 0
        ) && (
          <div className="search-header">
            {selectedCollections.length > 0 && (
              <h3 className="soft">
                {selectedCollections.length}{' '}
                collection{selectedCollections.length === 1 ? '' : 's'}{' '}
                w/{selectedCollectionsTotalDrops}{' '}
                drop{selectedCollectionsTotalDrops === 1 ? '' : 's'} =
              </h3>
            )}
            <h3>
              {selectedEvents.length + selectedCollectionsTotalDrops}{' '}
              drop{selectedEvents.length + selectedCollectionsTotalDrops === 1 ? '' : 's'}
            </h3>
          </div>
        )}
        {selectedNotInCollections.length > 0 && (
          selectedNotInCollections.map(
            (collection) => renderCollection(collection)
          )
        )}
        {selectedNotInEvents.length > 0 && (
          selectedNotInEvents.map(
            (event) => renderEvent(event)
          )
        )}
        {(
          selectedNotInCollections.length > 0 ||
          selectedNotInEvents.length > 0
        ) && (
          queryEvents.length > 0 ||
          queryCollections.length > 0 ||
          isLoading
        ) && (
          <hr className="search-separator" />
        )}
        {isLoading && (
          <div className="drop-preview">
            <div className="drop-info">
              <div className="drop-image loading-element">{' '}</div>
              <div className="drop-name loading-element" />
            </div>
          </div>
        )}
        {!isLoading && eventById && !selectedEventById && (
          renderEvent(eventById)
        )}
        {queryCollections.length > 0 && (
          queryCollections.map(
            (collection) => renderCollection(collection)
          )
        )}
        {queryEvents.length > 0 && (
          queryEvents.map((event) => (
            !eventById ||
            eventById.id !== event.id
          ) && (
            renderEvent(event)
          ))
        )}
        {queryEvents.length > 0 && pages > 1 && (
          <div className="search-pagination">
            <Pagination
              page={queryPage}
              pages={pages}
              total={maxTotal}
              onPage={onPageChange}
            />
          </div>
        )}
      </Card>
    </div>
  )
}

export default Search
