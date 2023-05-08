import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMatomo } from '@datapunt/matomo-tracker-react'
import { fetchEvent, searchEvents } from '../loaders/event'
import { parseEventIds, SEARCH_LIMIT } from '../models/event'
import Card from '../components/Card'
import TokenImage from './TokenImage'
import Pagination from './Pagination'
import '../styles/search.css'

function Search() {
  const navigate = useNavigate()
  const queryRef = useRef()
  const { trackSiteSearch } = useMatomo()
  const [loadingById, setLoadingById] = useState({ eventId: null, state: false, controller: null })
  const [loadingSearch, setLoadingSearch] = useState({ query: null, state: false, controller: null })
  const [timeoutId, setTimeoutId] = useState(null)
  const [errorById, setErrorById] = useState(null)
  const [errorSearch, setErrorSearch] = useState(null)
  const [errorSubmit, setErrorSubmit] = useState(null)
  const [eventById, setEventById] = useState(null)
  const [queryEvents, setQueryEvents] = useState([])
  const [queryTotal, setQueryTotal] = useState(null)
  const [queryPage, setQueryPage] = useState(1)
  const [selectedEvents, setSelectedEvents] = useState([])

  useEffect(
    () => () => {
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
    const controller = new AbortController()
    setLoadingSearch({
      query: value,
      state: true,
      controller,
    })
    setErrorSearch(null)
    setQueryEvents([])
    setQueryTotal(null)
    setQueryPage(page)
    searchEvents(value, controller.signal, (page - 1) * SEARCH_LIMIT, SEARCH_LIMIT).then(
      (results) => {
        if (page === 1) {
          trackSiteSearch({
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

  function onSearch() {
    if (selectedEvents.length === 1) {
      navigate(`/event/${selectedEvents[0].id}`)
      return
    }
    if (selectedEvents.length > 1) {
      const newEventIds = parseEventIds(`${selectedEvents.map((selected) => selected.id).join(',')}`)
      if (newEventIds.length > 0) {
        navigate(`/events/${newEventIds.join(',')}`)
        return
      }
    }
    if (eventById) {
      navigate(`/event/${eventById.id}`)
      return
    }
    const value = queryRef.current ? queryRef.current.value : ''
    if (/^[0-9]+$/.test(value)) {
      navigate(`/event/${value}`)
      return
    }
    if (queryEvents.length > 0) {
      setErrorSubmit(new Error('Select any POAP drop to continue'))
    } else if (value.length === 0) {
      setErrorSubmit(new Error('Search and select any POAP drop to continue'))
    } else {
      setErrorSubmit(new Error('Nothing to submit'))
    }
  }

  function onQueryKeyUp(event) {
    if (event.keyCode === 13) { // [Enter]
      onSearch()
    }
  }

  function onQueryChange() {
    const value = queryRef.current ? queryRef.current.value : ''
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
          if (!isNaN(parseInt(value))) {
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
      setQueryTotal(null)
      setQueryPage(1)
    }
  }

  function onSelectChange(eventId, checked) {
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
    setErrorSearch(null)
    setErrorById(null)
    setErrorSubmit(null)
  }

  const selectedNotInEvents = selectedEvents
    .filter(
      (selected) => queryEvents.findIndex((queried) => queried.id === selected.id) === -1
    )

  const renderEvent = (event) => (
    <div className="drop-preview" key={event.id}>
      <div className="drop-info">
        <div className="drop-image">
          <Link to={`/event/${event.id}`} className="drop-link">
            <TokenImage event={event} size={18} />
          </Link>
        </div>
        <h4 title={event.name}>{event.name}</h4>
        <div className="drop-select">
          <input
            type="checkbox"
            checked={selectedEvents.findIndex((selected) => selected.id === event.id) !== -1}
            onChange={(changeEvent) => onSelectChange(event.id, !!changeEvent.target.checked)}
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
          <input className="go" type="submit" value="Find POAPs In Common" disabled={!eventById && selectedEvents.length === 0} />
        </div>
      </form>
      {!errorById && !errorSearch && !errorSubmit && selectedEvents.length === 0 && queryEvents.length === 0 && !loadingById.state && !loadingSearch.state && !eventById && (
        <div className="search-options">
          <Link className="link" to="/addresses">manually enter collections</Link>
        </div>
      )}
      {errorById && queryEvents.length === 0 && (
        <div className="drop-error">
          <p>{errorById.message}</p>
        </div>
      )}
      {errorSearch && !eventById && (
        <div className="drop-error">
          <p>{errorSearch.message}</p>
        </div>
      )}
      {errorSubmit && (
        <div className="drop-error">
          <p>{errorSubmit.message}</p>
        </div>
      )}
      {(selectedEvents.length > 0 || queryEvents.length > 0) && (
        <div className="drop-header">
          <h3>{selectedEvents.length} drop{selectedEvents.length === 1 ? '' : 's'}</h3>
        </div>
      )}
      {selectedNotInEvents.length > 0 && (
        <>
          {selectedNotInEvents.map((event) => renderEvent(event))}
          {(queryEvents.length > 0 || loadingById.state || loadingSearch.state) && <hr className="drop-separator" />}
        </>
      )}
      {(loadingById.state || loadingSearch.state) && (
        <div className="drop-preview">
          <div className="drop-info">
            <div className="drop-image loading-element">{' '}</div>
            <h4 className="loading-element">{' '}</h4>
          </div>
        </div>
      )}
      {eventById && renderEvent(eventById)}
      {queryEvents.length > 0 && queryEvents.map((event) => (!eventById || eventById.id !== event.id) && renderEvent(event))}
      {queryEvents.length > 0 && Math.ceil(queryTotal / SEARCH_LIMIT) > 1 && (
        <div className="drop-pagination">
          <Pagination
            page={queryPage}
            pages={Math.ceil(queryTotal / SEARCH_LIMIT)}
            total={queryTotal}
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
