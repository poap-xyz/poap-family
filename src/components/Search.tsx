import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { joinEventIds, parseEventIds, SEARCH_LIMIT } from 'models/event'
import { Drop } from 'models/drop'
import { CollectionWithDrops } from 'models/collection'
import useEvent from 'hooks/useEvent'
import useEventSearch from 'hooks/useEventSearch'
import useCollectionSearch from 'hooks/useCollectionSearch'
import Card from 'components/Card'
import SearchResultEvent from 'components/SearchResultEvent'
import SearchResultCollection from 'components/SearchResultCollection'
import Pagination from 'components/Pagination'
import 'styles/search.css'

function Search() {
  const navigate = useNavigate()
  const timeoutId = useRef<NodeJS.Timeout | null>(null)
  const cancelSearch = useRef<() => void | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [query, setQuery] = useState<string>('')
  const [page, setPage] = useState<number>(1)
  const [selectedEvents, setSelectedEvents] = useState<Drop[]>([])
  const [selectedCollections, setSelectedCollections] = useState<CollectionWithDrops[]>([])

  const {
    loadingEvent,
    eventError,
    event,
    fetchEvent,
    retryEvent,
  } = useEvent()

  const {
    loadingEventSearch,
    eventSearchError,
    totalEventResults,
    resultEvents,
    searchEvents,
    retryEventSearch,
  } = useEventSearch()

  const {
    loadingCollectionSearch,
    collectionSearchError,
    totalCollectionResults,
    resultCollections,
    searchCollections,
    retryCollectionSearch,
  } = useCollectionSearch()

  const cancel = () => {
    if (timeoutId.current) {
      clearTimeout(timeoutId.current)
      timeoutId.current = null
    }
    if (cancelSearch.current) {
      cancelSearch.current()
      cancelSearch.current = null
    }
  }

  useEffect(
    () => () => {
      cancel()
    },
    []
  )

  function search(searchQuery: string, searchPage: number): void {
    let cancelEvent: () => void | undefined
    let cancelEventSearch: () => void | undefined
    let cancelCollectionSearch: () => void | undefined
    if (searchQuery.length > 0) {
      if (/^[0-9]+$/.test(searchQuery)) {
        const eventId = parseInt(searchQuery)
        if (!isNaN(eventId)) {
          cancelEvent = fetchEvent(eventId)
        }
      }
      cancelEventSearch = searchEvents(searchQuery, searchPage)
      cancelCollectionSearch = searchCollections(searchQuery, searchPage)
    }
    cancelSearch.current = () => {
      if (cancelEvent) {
        cancelEvent()
      }
      if (cancelEventSearch) {
        cancelEventSearch()
      }
      if (cancelCollectionSearch) {
        cancelCollectionSearch()
      }
    }
  }

  function onSearch(): void {
    if (selectedEvents.length === 1 && selectedCollections.length === 0) {
      navigate(`/event/${selectedEvents[0].id}`)
      return
    }
    if (selectedEvents.length === 0 && selectedCollections.length === 1) {
      navigate(`/events/${joinEventIds(selectedCollections[0].dropIds)}`)
      return
    }
    const newEventIds: number[] = []
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
    if (event) {
      navigate(`/event/${event.id}`)
      return
    }
    if (/^[0-9]+$/.test(query)) {
      navigate(`/event/${query}`)
      return
    }
    if (query.startsWith('#')) {
      const subValue = query.substring(1)
      if (/^[0-9]+$/.test(subValue)) {
        navigate(`/event/${subValue}`)
        return
      }
    }
    if (/^[0-9]+(, *[0-9]+)*$/.test(query)) {
      const rawEventIds = parseEventIds(query)
      if (rawEventIds.length > 0) {
        navigate(`/events/${joinEventIds(rawEventIds)}`)
        return
      }
    }
    if (resultCollections.length > 0 || resultEvents.length > 0) {
      setError(new Error('Select any POAP drop to continue'))
    } else if (query.length === 0) {
      setError(new Error('Search and select any POAP drop to continue'))
    }
  }

  function onQueryKeyUp(keyCode: number): void {
    if (keyCode === 13) { // [Enter]
      onSearch()
    }
  }

  function onQueryChange(newValue: string): void {
    setQuery(newValue)
    setPage(1)
    if (newValue.length === 0) {
      setError(null)
    }
    cancel()
    timeoutId.current = setTimeout(
      () => {
        search(newValue, 1)
      },
      750
    )
  }

  function clearErrors(): void {
    retryEvent()
    retryEventSearch()
    retryCollectionSearch()
    setError(null)
  }

  function addSelectEvent(eventId: number): void {
    const resultEvent = resultEvents.find((queried) => queried.id === eventId)
    if (resultEvent) {
      setSelectedEvents((prevSelectedEvents) => {
        const exists = -1 !== prevSelectedEvents.findIndex(
          (prevSelectedEvent) => prevSelectedEvent.id === resultEvent.id
        )
        if (exists) {
          return prevSelectedEvents
        }
        return [...prevSelectedEvents, resultEvent]
      })
    } else if (event) {
      setSelectedEvents((prevSelectedEvents) => {
        const exists = -1 !== prevSelectedEvents.findIndex(
          (prevSelectedEvent) => prevSelectedEvent.id === event.id
        )
        if (exists) {
          return prevSelectedEvents
        }
        return [...prevSelectedEvents, event]
      })
    }
    clearErrors()
  }

  function delSelectEvent(eventId: number): void {
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
    clearErrors()
  }

  function addSelectCollection(collectionId: number): void {
    const collection = resultCollections.find(
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
    clearErrors()
  }

  function delSelectCollection(collectionId: number): void {
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
    clearErrors()
  }

  const selectedNotInEvents = selectedEvents.filter(
    (selected) => -1 === resultEvents.findIndex(
      (queried) => queried.id === selected.id
    ) && (
      page !== 1 ||
      !event || (
        event.id !== selected.id
      )
    )
  )
  const selectedNotInCollections = selectedCollections.filter(
    (selected) => -1 === resultCollections.findIndex(
      (queried) => queried.id === selected.id
    )
  )
  const selectedCollectionsTotalDrops = selectedCollections.reduce(
    (total, collection) => total + collection.dropIds.length,
    0
  )

  const maxTotal = Math.max(totalEventResults, totalCollectionResults)
  const pages = Math.ceil(maxTotal / SEARCH_LIMIT)

  function onPageChange(newPage: number): void {
    setPage(newPage)
    cancel()
    search(query, newPage)
  }

  const isLoading = (
    loadingEvent ||
    loadingEventSearch ||
    loadingCollectionSearch
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
              className="query"
              type="search"
              name="query"
              placeholder="Search POAPs"
              onChange={(event) => onQueryChange(event.target.value)}
              onKeyUp={(event) => onQueryKeyUp(event.keyCode)}
              autoComplete="off"
              maxLength={256}
              size={24}
            />
            <input
              className="go"
              type="submit"
              value="Find POAPs In Common"
              disabled={!event &&
                selectedEvents.length === 0 &&
                selectedCollections.length === 0}
            />
          </div>
        </form>
        {(
          !eventError &&
          !eventSearchError &&
          !collectionSearchError &&
          !error &&
          selectedEvents.length === 0 &&
          selectedCollections.length === 0 &&
          resultEvents.length === 0 &&
          resultCollections.length === 0 &&
          !isLoading &&
          !event
        ) && (
          <div className="search-options">
            <Link className="link" to="/addresses">
              manually enter collections
            </Link>
          </div>
        )}
        {eventError && resultEvents.length === 0 && resultCollections.length === 0 && (
          <div className="search-error">
            <p>{eventError.message}</p>
          </div>
        )}
        {eventSearchError && !event && (
          <div className="search-error">
            <p>{eventSearchError.message}</p>
          </div>
        )}
        {collectionSearchError && !event && (
          <div className="search-error">
            <p>{collectionSearchError.message}</p>
          </div>
        )}
        {error && (
          <div className="search-error">
            <p>{error.message}</p>
          </div>
        )}
        {(
          selectedEvents.length > 0 ||
          selectedCollections.length > 0 ||
          resultEvents.length > 0 ||
          resultCollections.length > 0
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
            (selectedCollection) => (
              <SearchResultCollection
                key={selectedCollection.id}
                collection={selectedCollection}
                checked={true}
                onCheckChange={() => delSelectCollection(selectedCollection.id)}
                className="search-result"
              />
            )
          )
        )}
        {selectedNotInEvents.length > 0 && (
          selectedNotInEvents.map(
            (selectedEvent) => (
              <SearchResultEvent
                key={selectedEvent.id}
                event={selectedEvent}
                checked={true}
                onCheckChange={() => delSelectEvent(selectedEvent.id)}
                className="search-result"
              />
            )
          )
        )}
        {(
          selectedNotInCollections.length > 0 ||
          selectedNotInEvents.length > 0
        ) && (
          resultEvents.length > 0 ||
          resultCollections.length > 0 ||
          isLoading
        ) && (
          <hr className="search-separator" />
        )}
        {isLoading && (
          <div className="search-result">
            <div className="search-result-info">
              <div className="search-result-image skeleton">{' '}</div>
              <div className="search-result-name skeleton" />
            </div>
          </div>
        )}
        {!isLoading && event && page === 1 && (
          <SearchResultEvent
            key={event.id}
            event={event}
            checked={-1 !== selectedEvents.findIndex(
              (selected) => selected.id === event.id
            )}
            onCheckChange={(checked) => {
              if (checked) {
                addSelectEvent(event.id)
              } else {
                delSelectEvent(event.id)
              }
            }}
            className="search-result"
          />
        )}
        {resultCollections.length > 0 && (
          resultCollections.map(
            (resultCollection) => (
              <SearchResultCollection
                key={resultCollection.id}
                collection={resultCollection}
                checked={-1 !== selectedCollections.findIndex(
                  (selected) => selected.id === resultCollection.id
                )}
                onCheckChange={(checked) => {
                  if (checked) {
                    addSelectCollection(resultCollection.id)
                  } else {
                    delSelectCollection(resultCollection.id)
                  }
                }}
                className="search-result"
              />
            )
          )
        )}
        {resultEvents.length > 0 && (
          resultEvents.map((resultEvent) => (
            !event ||
            event.id !== resultEvent.id
          ) && (
            <SearchResultEvent
              key={resultEvent.id}
              event={resultEvent}
              checked={-1 !== selectedEvents.findIndex(
                (selected) => selected.id === resultEvent.id
              )}
              onCheckChange={(checked) => {
                if (checked) {
                  addSelectEvent(resultEvent.id)
                } else {
                  delSelectEvent(resultEvent.id)
                }
              }}
              className="search-result"
            />
          ))
        )}
        {resultEvents.length > 0 && pages > 1 && (
          <div className="search-pagination">
            <Pagination
              page={page}
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
