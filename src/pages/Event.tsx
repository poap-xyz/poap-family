import { useContext, useEffect, useMemo, useState } from 'react'
import { useLoaderData, useSearchParams } from 'react-router-dom'
import { HTMLContext } from 'stores/html'
import { ReverseEnsContext } from 'stores/ethereum'
import { parseDropData } from 'models/drop'
import { EnsByAddress } from 'models/ethereum'
import useEventInCommon from 'hooks/useEventInCommon'
import useEventsCollections from 'hooks/useEventsCollections'
import Timestamp from 'components/Timestamp'
import Page from 'components/Page'
import Card from 'components/Card'
import Loading from 'components/Loading'
import EventsInCommon from 'components/EventsInCommon'
import EventInfo from 'components/EventInfo'
import EventStats from 'components/EventStats'
import CollectionSet from 'components/CollectionSet'
import AddressErrorList from 'components/AddressErrorList'
import WarningMessage from 'components/WarningMessage'
import ErrorMessage from 'components/ErrorMessage'
import ButtonLink from 'components/ButtonLink'
import ButtonExportAddressCsv from 'components/ButtonExportAddressCsv'
import EventButtonGroup from 'components/EventButtonGroup'
import EventButtonMoments from 'components/EventButtonMoments'
import 'styles/event.css'

function Event() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { setTitle } = useContext(HTMLContext)
  const { resolveEnsNames } = useContext(ReverseEnsContext)
  const loaderData = useLoaderData()
  const [eventsEnsNames, setEventsEnsNames] = useState<Record<number, EnsByAddress>>({})

  const force = searchParams.get('force') === 'true'

  const { drop, collectors, metrics } = useMemo(
    () => parseDropData(
      loaderData,
      /*includeDescription*/true,
      /*includeMetrics*/true,
    ),
    [loaderData]
  )

  const {
    completedEventInCommon,
    loadingEventInCommon,
    loadedInCommon,
    loadedInCommonDrops,
    loadedInCommonDownload,
    loadedOwners,
    ownersErrors,
    inCommon,
    drops,
    cachedTs,
    fetchEventInCommon,
    retryAddress,
  } = useEventInCommon(
    drop.id,
    collectors,
    /*refresh*/force,
    /*local*/false,
    /*stream*/true
  )

  const dropIds = useMemo(
    () => [drop.id],
    [drop]
  )

  const {
    loadingCollections,
    collectionsError,
    collections,
    fetchEventsCollections,
  } = useEventsCollections(
    dropIds
  )

  useEffect(
    () => {
      resolveEnsNames(collectors)
    },
    [collectors, resolveEnsNames]
  )

  useEffect(
    () => {
      const cancelEventInCommon = fetchEventInCommon()
      return () => {
        cancelEventInCommon()
      }
    },
    [fetchEventInCommon]
  )

  useEffect(
    () => {
      setTitle(drop.name)
    },
    [drop.name, setTitle]
  )

  useEffect(
    () => {
      let cancelEventsCollections: () => void | undefined
      if (
        metrics &&
        metrics.collectionsIncludes > 0 &&
        completedEventInCommon
      ) {
        cancelEventsCollections = fetchEventsCollections()
      }
      return () => {
        if (cancelEventsCollections) {
          cancelEventsCollections()
        }
      }
    },
    [
      metrics,
      completedEventInCommon,
      fetchEventsCollections,
    ]
  )

  function refreshCache(): void {
    setSearchParams({ force: 'true' })
  }

  function handleDropActive(dropId: number): void {
    const addresses = inCommon[dropId]
    if (addresses != null && addresses.length > 0) {
      resolveEnsNames(addresses).then((ensNames) => {
        setEventsEnsNames((prevEventsEnsNames) => ({
          ...prevEventsEnsNames,
          [dropId]: ensNames,
        }))
      })
    }
  }

  return (
    <Page>
      <div className="event">
        <div className="event-header-info">
          <EventInfo drop={drop}>
            <EventStats
              drop={drop}
              collectors={collectors.length}
              metrics={metrics}
            />
            <EventButtonGroup drop={drop} viewInGallery={true}>
              <ButtonExportAddressCsv
                filename={`collectors-${drop.id}`}
                name={drop.name}
                addresses={collectors}
                title={
                  `Generates CSV file with collectors of drop #${drop.id}`
                }
              />
              <EventButtonMoments drop={drop} />
            </EventButtonGroup>
            {cachedTs &&
              <div className="cached">
                Cached <Timestamp ts={cachedTs} />,{' '}
                <ButtonLink onClick={() => refreshCache()}>refresh</ButtonLink>.
              </div>
            }
          </EventInfo>
        </div>
        {loadingEventInCommon && (
          <Card>
            {loadedOwners > 0
              ? <Loading count={loadedOwners} total={collectors.length} />
              : (
                loadedInCommonDrops != null
                  ? (
                    <Loading
                      count={loadedInCommonDrops.count}
                      total={loadedInCommonDrops.total}
                    />
                  )
                  : (
                      loadedInCommon != null
                        ? (
                          <Loading
                            count={loadedInCommon.count}
                            total={loadedInCommon.total}
                            totalFinal={loadedInCommon.totalFinal}
                          />
                        )
                        : (
                          loadedInCommonDownload != null
                            ? (
                                <Loading
                                  progress={loadedInCommonDownload.progress}
                                  eta={loadedInCommonDownload.estimated}
                                  rate={loadedInCommonDownload.rate}
                                />
                              )
                            : <Loading />
                        )
                    )
              )
            }
            <AddressErrorList errors={ownersErrors} onRetry={retryAddress} />
          </Card>
        )}
        {!loadingEventInCommon && (
          <>
            {(
              cachedTs &&
              drop.id in inCommon &&
              inCommon[drop.id].length !== collectors.length
            ) && (
              <WarningMessage>
                There have been new mints since this POAP was cached,{' '}
                <ButtonLink onClick={() => refreshCache()}>refresh</ButtonLink>.
              </WarningMessage>
            )}
            {ownersErrors.length > 0 && (
              <Card>
                <AddressErrorList
                  errors={ownersErrors}
                  onRetry={retryAddress}
                />
              </Card>
            )}
            {loadingCollections && collectionsError == null && (
              <Card>
                <h4>Collections</h4>
                <Loading />
              </Card>
            )}
            {!loadingCollections && collectionsError != null && (
              <Card>
                <h4>Collections</h4>
                <ErrorMessage error={collectionsError} />
              </Card>
            )}
            {(
              !loadingCollections &&
              collectionsError == null &&
              collections != null
            ) && (
              <CollectionSet
                showEmpty={metrics && metrics.collectionsIncludes > 0}
                emptyMessage={`No collections found that includes ${drop.name}`}
                collectionMap={{
                  [`${collections.length} collections`]: collections,
                }}
              />
            )}
            {completedEventInCommon && loadedOwners === 0 && (
              <Card>
                <ErrorMessage message="No collectors" />
              </Card>
            )}
            {cachedTs && (
              <EventsInCommon
                onActive={handleDropActive}
                inCommon={inCommon}
                drops={drops}
                baseDropIds={dropIds}
                eventsEnsNames={eventsEnsNames}
              />
            )}
          </>
        )}
      </div>
    </Page>
  )
}

export default Event
