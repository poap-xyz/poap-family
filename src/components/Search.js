import { useContext, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMatomo } from '@datapunt/matomo-tracker-react'
import { SettingsContext } from '../stores/cache'
import { fetchEvent, searchEvents } from '../loaders/event'
import { searchCollections } from '../loaders/collection'
import { joinEventIds, parseEventIds, SEARCH_LIMIT } from '../models/event'
import { resizeCollectionImageUrl } from '../models/collection'
import Card from '../components/Card'
import TokenImage from './TokenImage'
import Pagination from './Pagination'
import '../styles/search.css'

function Search() {
  const navigate = useNavigate()
  const queryRef = useRef()
  const { trackSiteSearch } = useMatomo()
  const { settings } = useContext(SettingsContext)
  const [loadingById, setLoadingById] = useState({ eventId: null, state: false, controller: null })
  const [loadingSearch, setLoadingSearch] = useState({ query: null, state: false, controller: null })
  const [loadingSearchCollections, setLoadingSearchCollections] = useState({ query: null, state: false, controller: null })
  const [timeoutId, setTimeoutId] = useState(null)
  const [errorById, setErrorById] = useState(null)
  const [errorSearch, setErrorSearch] = useState(null)
  const [errorSearchCollections, setErrorSearchCollections] = useState(null)
  const [errorSubmit, setErrorSubmit] = useState(null)
  const [eventById, setEventById] = useState(null)
  const [queryEvents, setQueryEvents] = useState([])
  const [queryCollections, setQueryCollections] = useState([])
  const [queryTotal, setQueryTotal] = useState(null)
  const [queryTotalCollections, setQueryTotalCollections] = useState(null)
  const [queryPage, setQueryPage] = useState(1)
  const [selectedEvents, setSelectedEvents] = useState([])
  const [selectedCollections, setSelectedCollections] = useState([])

  useEffect(
    () => () => {
      if (loadingSearchCollections.state) {
        loadingSearchCollections.controller.abort()
      }
      if (loadingSearch.state) {
        loadingSearch.controller.abort()
      }
      if (loadingById.state) {
        loadingById.controller.abort()
      }
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    },
    [] // eslint-disable-line react-hooks/exhaustive-deps
  )

  const findEvent = (eventId) => {
    const controller = new AbortController()
    setLoadingById({
      eventId,
      state: true,
      controller,
    })
    setErrorById(null)
    setEventById(null)
    fetchEvent(eventId, controller.signal).then(
      (result) => {
        setLoadingById({ eventId: null, state: false, controller: null })
        if (result) {
          setEventById(result)
        } else {
          setErrorById(new Error(`Event ${eventId} not found`))
        }
      },
      (err) => {
        if (err.code !== 20) {
          console.error(err)
          if (err instanceof Error) {
            setErrorById(err)
          }
        }
        setLoadingById({ eventId: null, state: false, controller: null })
      }
    )
  }

  const search = (value, page = 1) => {
    setQueryPage(page)
    setErrorSearch(null)
    setQueryEvents([])
    setQueryTotal(null)
    if (queryTotal == null || (page - 1) * SEARCH_LIMIT <= queryTotal) {
      const controller = new AbortController()
      setLoadingSearch({
        query: value,
        state: true,
        controller,
      })
      searchEvents(value, controller.signal, (page - 1) * SEARCH_LIMIT, SEARCH_LIMIT).then(
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
          setLoadingSearch({ query: null, state: false, controller: null })
        }
      )
    }
    setErrorSearchCollections(null)
    setQueryCollections([])
    setQueryTotalCollections(null)
    if (
      settings.showCollections && (
        queryTotalCollections == null ||
        (page - 1) * SEARCH_LIMIT <= queryTotalCollections
      )
    ) {
      const controller = new AbortController()
      setLoadingSearchCollections({
        query: value,
        state: true,
        controller,
      })
      searchCollections(value, (page - 1) * SEARCH_LIMIT, SEARCH_LIMIT, controller.signal).then(
        (results) => {
          if (page === 1) {
            trackSiteSearch({
              category: 'collections',
              keyword: value,
              count: results.total,
            })
          }
          setLoadingSearchCollections({ query: null, state: false, controller: null })
          if (queryRef.current && String(value) === queryRef.current.value) {
            setQueryCollections(results.items)
            setQueryTotalCollections(results.total)
          }
        },
        (err) => {
          if (err.code !== 20) {
            console.error(err)
            if (err instanceof Error) {
              setErrorSearchCollections(err)
            }
          }
          setLoadingSearchCollections({ query: null, state: false, controller: null })
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

  function onQueryKeyUp(event) {
    if (event.keyCode === 13) { // [Enter]
      onSearch()
    }
  }

  function onQueryChange() {
    const value = queryRef.current ? queryRef.current.value : ''
    if (loadingSearchCollections.state) {
      loadingSearchCollections.controller.abort()
    }
    if (loadingSearch.state) {
      loadingSearch.controller.abort()
    }
    if (loadingById.state) {
      loadingById.controller.abort()
    }
    if (timeoutId) {
      clearTimeout(timeoutId)
      setTimeoutId(null)
    }
    if (value.length > 0) {
      setTimeoutId(setTimeout(
        () => {
          search(value, 1)
          if (/^[0-9]+$/.test(value)) {
            findEvent(value)
          } else {
            setErrorById(null)
            setEventById(null)
          }
        },
        750
      ))
    } else {
      setErrorById(null)
      setErrorSearch(null)
      setErrorSubmit(null)
      setEventById(null)
      setQueryEvents([])
      setQueryCollections([])
      setQueryTotal(null)
      setQueryPage(1)
      setLoadingById({ eventId: null, state: false, controller: null })
      setLoadingSearch({ query: null, state: false, controller: null })
      setLoadingSearchCollections({ query: null, state: false, controller: null })
    }
  }

  function onSelectEventChange(eventId, checked) {
    if (checked) {
      const event = queryEvents.find((queried) => queried.id === eventId)
      if (event) {
        setSelectedEvents((prevSelectedEvents) => {
          if (prevSelectedEvents.findIndex((prevSelectedEvent) => prevSelectedEvent.id === event.id) !== -1) {
            return prevSelectedEvents
          }
          return [...prevSelectedEvents, event]
        })
      } else if (eventById) {
        setSelectedEvents((prevSelectedEvents) => {
          if (prevSelectedEvents.findIndex((prevSelectedEvent) => prevSelectedEvent.id === eventById.id) !== -1) {
            return prevSelectedEvents
          }
          return [...prevSelectedEvents, eventById]
        })
        setEventById(null)
      }
    } else {
      const selectedIndex = selectedEvents.findIndex((selected) => selected.id === eventId)
      if (selectedIndex !== -1) {
        setSelectedEvents((prevSelectedEvents) => {
          const newSelectedEvents = [...prevSelectedEvents]
          newSelectedEvents.splice(selectedIndex, 1)
          return newSelectedEvents
        })
      }
    }
    setErrorSearchCollections(null)
    setErrorSearch(null)
    setErrorById(null)
    setErrorSubmit(null)
  }

  function onSelectCollectionChange(collectionId, checked) {
    if (checked) {
      const collection = queryCollections.find((queried) => queried.id === collectionId)
      if (collection) {
        setSelectedCollections((prevSelectedCollections) => {
          if (prevSelectedCollections.findIndex((prevSelectedCollection) => prevSelectedCollection.id === collection.id) !== -1) {
            return prevSelectedCollections
          }
          return [...prevSelectedCollections, collection]
        })
      }
    } else {
      const selectedIndex = selectedCollections.findIndex((selected) => selected.id === collectionId)
      if (selectedIndex !== -1) {
        setSelectedCollections((prevSelectedCollections) => {
          const newSelectedCollections = [...prevSelectedCollections]
          newSelectedCollections.splice(selectedIndex, 1)
          return newSelectedCollections
        })
      }
    }
    setErrorSearchCollections(null)
    setErrorSearch(null)
    setErrorById(null)
    setErrorSubmit(null)
  }

  const selectedNotInEvents = selectedEvents
    .filter(
      (selected) => queryEvents.findIndex((queried) => queried.id === selected.id) === -1
    )
  const selectedNotInCollections = selectedCollections
    .filter(
      (selected) => queryCollections.findIndex((queried) => queried.id === selected.id) === -1
    )
  const selectedCollectionsTotalDrops = selectedCollections.reduce((total, collection) => total + collection.dropIds.length, 0)

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
            checked={selectedEvents.findIndex((selected) => selected.id === event.id) !== -1}
            onChange={(changeEvent) => onSelectEventChange(event.id, !!changeEvent.target.checked)}
          />
        </div>
      </div>
    </div>
  )

  const renderCollection = (collection) => (
    <div className="collection-preview" key={collection.id}>
      {collection.banner_image_url && (
        <div className="collection-banner">
          <img
            src={resizeCollectionImageUrl(collection.banner_image_url, { w: 480, h: 40 })}
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
                src={resizeCollectionImageUrl(collection.logo_image_url, { w: 18, h: 18 })}
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
            checked={selectedCollections.findIndex((selected) => selected.id === collection.id) !== -1}
            onChange={(changeEvent) => onSelectCollectionChange(collection.id, !!changeEvent.target.checked)}
          />
        </div>
      </div>
    </div>
  )

  return (
    <Card>
      <form role="search" onSubmit={(event) => { event.preventDefault(); onSearch() }}>
        <div className="search">
          <input
            ref={queryRef}
            className="query"
            type="search"
            name="query"
            placeholder="Search POAP drops"
            onChange={onQueryChange}
            onKeyUp={onQueryKeyUp}
            autoComplete="off"
            maxLength="256"
            size="24"
          />
          <input
            className="go"
            type="submit"
            value="Find POAPs In Common"
            disabled={!eventById && selectedEvents.length === 0 && selectedCollections.length === 0}
          />
        </div>
      </form>
      {!errorById && !errorSearch && !errorSearchCollections && !errorSubmit && selectedEvents.length === 0 && selectedCollections.length === 0 && queryEvents.length === 0 && queryCollections.length === 0 && !loadingById.state && !loadingSearch.state && !loadingSearchCollections.state && !eventById && (
        <div className="search-options">
          <Link className="link" to="/addresses">manually enter collections</Link>
        </div>
      )}
      {errorById && queryEvents.length === 0 && queryCollections.length === 0 && (
        <div className="drop-error">
          <p>{errorById.message}</p>
        </div>
      )}
      {errorSearch && !eventById && (
        <div className="drop-error">
          <p>{errorSearch.message}</p>
        </div>
      )}
      {errorSearchCollections && !eventById && (
        <div className="drop-error">
          <p>{errorSearchCollections.message}</p>
        </div>
      )}
      {errorSubmit && (
        <div className="drop-error">
          <p>{errorSubmit.message}</p>
        </div>
      )}
      {(selectedEvents.length > 0 || selectedCollections.length > 0 || queryEvents.length > 0 || queryCollections.length > 0) && (
        <div className="drop-header">
          {selectedCollections.length > 0 && (
            <>
              <h3 className="soft">
                {selectedCollections.length} collection{selectedCollections.length === 1 ? '' : 's'} w/{selectedCollectionsTotalDrops} drop{selectedCollectionsTotalDrops === 1 ? '' : 's'} =
              </h3>
            </>
          )}
          <h3>{selectedEvents.length + selectedCollectionsTotalDrops} drop{selectedEvents.length + selectedCollectionsTotalDrops === 1 ? '' : 's'}</h3>
        </div>
      )}
      {selectedNotInCollections.length > 0 && (
        <>{selectedNotInCollections.map((collection) => renderCollection(collection))}</>
      )}
      {selectedNotInEvents.length > 0 && (
        <>{selectedNotInEvents.map((event) => renderEvent(event))}</>
      )}
      {(selectedNotInCollections.length > 0 || selectedNotInEvents.length > 0) && (queryEvents.length > 0 || queryCollections.length > 0 || loadingById.state || loadingSearch.state || loadingSearchCollections.state) && (
        <hr className="drop-separator" />
      )}
      {(loadingById.state || loadingSearch.state || loadingSearchCollections.state) && (
        <div className="drop-preview">
          <div className="drop-info">
            <div className="drop-image loading-element">{' '}</div>
            <div className="drop-name loading-element" />
          </div>
        </div>
      )}
      {eventById && renderEvent(eventById)}
      {queryCollections.length > 0 && queryCollections.map((collection) => renderCollection(collection))}
      {queryEvents.length > 0 && queryEvents.map((event) => (!eventById || eventById.id !== event.id) && renderEvent(event))}
      {queryEvents.length > 0 && Math.ceil(Math.max(queryTotal, queryTotalCollections) / SEARCH_LIMIT) > 1 && (
        <div className="drop-pagination">
          <Pagination
            page={queryPage}
            pages={Math.ceil(Math.max(queryTotal, queryTotalCollections) / SEARCH_LIMIT)}
            total={Math.max(queryTotal, queryTotalCollections)}
            onPage={(newPage) => {
              const value = queryRef.current ? queryRef.current.value : ''
              if (value.length > 0) {
                search(value, newPage)
              }
            }}
          />
        </div>
      )}
    </Card>
  )
}

export default Search
