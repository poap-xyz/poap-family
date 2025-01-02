import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { SEARCH_LIMIT, Drop, parseDropIds, joinDropIds } from 'models/drop'
import { CollectionWithDrops } from 'models/collection'
import useDrop from 'hooks/useDrop'
import useDropSearch from 'hooks/useDropSearch'
import useCollectionSearch from 'hooks/useCollectionSearch'
import Card from 'components/Card'
import SearchResultDrop from 'components/SearchResultDrop'
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
  const [selectedDrops, setSelectedDrops] = useState<Drop[]>([])
  const [selectedCollections, setSelectedCollections] = useState<CollectionWithDrops[]>([])

  const {
    loading: loadingDrop,
    error: dropError,
    drop,
    fetchDrop,
    retryDrop,
  } = useDrop()

  const {
    loading: loadingSearch,
    error: errorSearch,
    total: totalResults,
    resultDrops,
    searchDrops,
    retryDropSearch,
  } = useDropSearch()

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
    let cancelDrop: () => void | undefined
    let cancelDropSearch: () => void | undefined
    let cancelCollectionSearch: () => void | undefined
    if (searchQuery.length > 0) {
      if (/^[0-9]+$/.test(searchQuery)) {
        const dropId = parseInt(searchQuery)
        if (!isNaN(dropId)) {
          cancelDrop = fetchDrop(dropId)
        }
      }
      cancelDropSearch = searchDrops(searchQuery, searchPage)
      cancelCollectionSearch = searchCollections(searchQuery, searchPage)
    }
    cancelSearch.current = () => {
      if (cancelDrop) {
        cancelDrop()
      }
      if (cancelDropSearch) {
        cancelDropSearch()
      }
      if (cancelCollectionSearch) {
        cancelCollectionSearch()
      }
    }
  }

  function onSearch(): void {
    if (selectedDrops.length === 1 && selectedCollections.length === 0) {
      navigate(`/drop/${selectedDrops[0].id}`)
      return
    }
    if (selectedDrops.length === 0 && selectedCollections.length === 1) {
      navigate(`/drops/${joinDropIds(selectedCollections[0].dropIds)}`)
      return
    }
    const newDropIds: number[] = []
    if (selectedDrops.length > 0) {
      for (const selectedDrop of selectedDrops) {
        newDropIds.push(selectedDrop.id)
      }
    }
    if (selectedCollections.length > 0) {
      for (const selectedCollection of selectedCollections) {
        newDropIds.push(...selectedCollection.dropIds)
      }
    }
    if (newDropIds.length > 0) {
      navigate(`/drops/${joinDropIds(newDropIds)}`)
      return
    }
    if (drop) {
      navigate(`/drop/${drop.id}`)
      return
    }
    if (/^[0-9]+$/.test(query)) {
      navigate(`/drop/${query}`)
      return
    }
    if (query.startsWith('#')) {
      const subValue = query.substring(1)
      if (/^[0-9]+$/.test(subValue)) {
        navigate(`/drop/${subValue}`)
        return
      }
    }
    if (/^[0-9]+(, *[0-9]+)*$/.test(query)) {
      const rawDropIds = parseDropIds(query)
      if (rawDropIds.length > 0) {
        navigate(`/drops/${joinDropIds(rawDropIds)}`)
        return
      }
    }
    if (resultCollections.length > 0 || resultDrops.length > 0) {
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
    retryDrop()
    retryDropSearch()
    retryCollectionSearch()
    setError(null)
  }

  function addSelectDrop(dropId: number): void {
    const resultDrop = resultDrops.find((queried) => queried.id === dropId)
    if (resultDrop) {
      setSelectedDrops((prevSelectedDrops) => {
        const exists = -1 !== prevSelectedDrops.findIndex(
          (prevSelectedDrop) => prevSelectedDrop.id === resultDrop.id
        )
        if (exists) {
          return prevSelectedDrops
        }
        return [...prevSelectedDrops, resultDrop]
      })
    } else if (drop) {
      setSelectedDrops((prevSelectedDrops) => {
        const exists = -1 !== prevSelectedDrops.findIndex(
          (prevSelectedDrop) => prevSelectedDrop.id === drop.id
        )
        if (exists) {
          return prevSelectedDrops
        }
        return [...prevSelectedDrops, drop]
      })
    }
    clearErrors()
  }

  function delSelectDrop(dropId: number): void {
    const selectedIndex = selectedDrops.findIndex(
      (selected) => selected.id === dropId
    )
    if (selectedIndex !== -1) {
      setSelectedDrops((prevSelectedDrops) => {
        const newSelectedDrops = [...prevSelectedDrops]
        newSelectedDrops.splice(selectedIndex, 1)
        return newSelectedDrops
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

  const selectedNotInDrops = selectedDrops.filter(
    (selected) => -1 === resultDrops.findIndex(
      (queried) => queried.id === selected.id
    ) && (
      page !== 1 ||
      !drop || (
        drop.id !== selected.id
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

  const maxTotal = Math.max(totalResults, totalCollectionResults)
  const pages = Math.ceil(maxTotal / SEARCH_LIMIT)

  function onPageChange(newPage: number): void {
    setPage(newPage)
    cancel()
    search(query, newPage)
  }

  const isLoading = (
    loadingDrop ||
    loadingSearch ||
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
              disabled={!drop &&
                selectedDrops.length === 0 &&
                selectedCollections.length === 0}
            />
          </div>
        </form>
        {(
          !dropError &&
          !errorSearch &&
          !collectionSearchError &&
          !error &&
          selectedDrops.length === 0 &&
          selectedCollections.length === 0 &&
          resultDrops.length === 0 &&
          resultCollections.length === 0 &&
          !isLoading &&
          !drop
        ) && (
          <div className="search-options">
            <Link className="link" to="/addresses">
              manually enter collections
            </Link>
          </div>
        )}
        {dropError && resultDrops.length === 0 && resultCollections.length === 0 && (
          <div className="search-error">
            <p>{dropError.message}</p>
          </div>
        )}
        {errorSearch && !drop && (
          <div className="search-error">
            <p>{errorSearch.message}</p>
          </div>
        )}
        {collectionSearchError && !drop && (
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
          selectedDrops.length > 0 ||
          selectedCollections.length > 0 ||
          resultDrops.length > 0 ||
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
              {selectedDrops.length + selectedCollectionsTotalDrops}{' '}
              drop{selectedDrops.length + selectedCollectionsTotalDrops === 1 ? '' : 's'}
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
        {selectedNotInDrops.length > 0 && (
          selectedNotInDrops.map(
            (selectedDrop) => (
              <SearchResultDrop
                key={selectedDrop.id}
                drop={selectedDrop}
                checked={true}
                onCheckChange={() => delSelectDrop(selectedDrop.id)}
                className="search-result"
              />
            )
          )
        )}
        {(
          selectedNotInCollections.length > 0 ||
          selectedNotInDrops.length > 0
        ) && (
          resultDrops.length > 0 ||
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
        {!isLoading && drop && page === 1 && (
          <SearchResultDrop
            key={drop.id}
            drop={drop}
            checked={-1 !== selectedDrops.findIndex(
              (selected) => selected.id === drop.id
            )}
            onCheckChange={(checked) => {
              if (checked) {
                addSelectDrop(drop.id)
              } else {
                delSelectDrop(drop.id)
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
        {resultDrops.length > 0 && (
          resultDrops.map((resultDrop) => (
            !drop ||
            drop.id !== resultDrop.id
          ) && (
            <SearchResultDrop
              key={resultDrop.id}
              drop={resultDrop}
              checked={-1 !== selectedDrops.findIndex(
                (selected) => selected.id === resultDrop.id
              )}
              onCheckChange={(checked) => {
                if (checked) {
                  addSelectDrop(resultDrop.id)
                } else {
                  delSelectDrop(resultDrop.id)
                }
              }}
              className="search-result"
            />
          ))
        )}
        {resultDrops.length > 0 && pages > 1 && (
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
