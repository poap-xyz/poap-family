import { useContext, useEffect, useMemo, useState } from 'react'
import { useLoaderData, useSearchParams } from 'react-router-dom'
import { HTMLContext } from 'stores/html'
import { ReverseEnsContext } from 'stores/ethereum'
import { parseDropData } from 'models/drop'
import { EnsByAddress } from 'models/ethereum'
import useEventInCommon from 'hooks/useEventInCommon'
import useDropsCollections from 'hooks/useDropsCollections'
import Timestamp from 'components/Timestamp'
import Page from 'components/Page'
import Card from 'components/Card'
import Loading from 'components/Loading'
import DropsInCommon from 'components/DropsInCommon'
import DropInfo from 'components/DropInfo'
import DropStats from 'components/DropStats'
import CollectionSet from 'components/CollectionSet'
import AddressErrorList from 'components/AddressErrorList'
import WarningMessage from 'components/WarningMessage'
import ErrorMessage from 'components/ErrorMessage'
import ButtonLink from 'components/ButtonLink'
import ButtonExportAddressCsv from 'components/ButtonExportAddressCsv'
import DropButtonGroup from 'components/DropButtonGroup'
import DropButtonMoments from 'components/DropButtonMoments'
import 'styles/event.css'

function Drop() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { setTitle } = useContext(HTMLContext)
  const { resolveEnsNames } = useContext(ReverseEnsContext)
  const loaderData = useLoaderData()
  const [dropsEnsNames, setDropsEnsNames] = useState<Record<number, EnsByAddress>>({})

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
    completedEventInCommon: completedDropInCommon,
    loadingEventInCommon: loadingDropInCommon,
    loadedInCommon,
    loadedInCommonDrops,
    loadedInCommonDownload,
    loadedCollectors,
    collectorsErrors,
    inCommon,
    drops,
    cachedTs,
    fetchDropInCommon,
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
    loading: loadingCollections,
    error: collectionsError,
    collections,
    fetchDropsCollections,
  } = useDropsCollections(
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
      const cancelDropInCommon = fetchDropInCommon()
      return () => {
        cancelDropInCommon()
      }
    },
    [fetchDropInCommon]
  )

  useEffect(
    () => {
      setTitle(drop.name)
    },
    [drop.name, setTitle]
  )

  useEffect(
    () => {
      let cancelDropsCollections: () => void | undefined
      if (
        metrics &&
        metrics.collectionsIncludes > 0 &&
        completedDropInCommon
      ) {
        cancelDropsCollections = fetchDropsCollections()
      }
      return () => {
        if (cancelDropsCollections) {
          cancelDropsCollections()
        }
      }
    },
    [
      metrics,
      completedDropInCommon,
      fetchDropsCollections,
    ]
  )

  function refreshCache(): void {
    setSearchParams({ force: 'true' })
  }

  function handleDropActive(dropId: number): void {
    const addresses = inCommon[dropId]
    if (addresses != null && addresses.length > 0) {
      resolveEnsNames(addresses).then((ensNames) => {
        setDropsEnsNames((prevDropsEnsNames) => ({
          ...prevDropsEnsNames,
          [dropId]: ensNames,
        }))
      })
    }
  }

  return (
    <Page>
      <div className="event">
        <div className="event-header-info">
          <DropInfo drop={drop}>
            <DropStats
              drop={drop}
              collectors={collectors.length}
              metrics={metrics}
            />
            <DropButtonGroup drop={drop} viewInGallery={true}>
              <ButtonExportAddressCsv
                filename={`collectors-${drop.id}`}
                name={drop.name}
                addresses={collectors}
                title={
                  `Generates CSV file with collectors of drop #${drop.id}`
                }
              />
              <DropButtonMoments drop={drop} />
            </DropButtonGroup>
            {cachedTs &&
              <div className="cached">
                Cached <Timestamp ts={cachedTs} />,{' '}
                <ButtonLink onClick={() => refreshCache()}>refresh</ButtonLink>.
              </div>
            }
          </DropInfo>
        </div>
        {loadingDropInCommon && (
          <Card>
            {loadedCollectors > 0
              ? <Loading count={loadedCollectors} total={collectors.length} />
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
            <AddressErrorList errors={collectorsErrors} onRetry={retryAddress} />
          </Card>
        )}
        {!loadingDropInCommon && (
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
            {collectorsErrors.length > 0 && (
              <Card>
                <AddressErrorList
                  errors={collectorsErrors}
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
            {completedDropInCommon && loadedCollectors === 0 && (
              <Card>
                <ErrorMessage message="No collectors" />
              </Card>
            )}
            {cachedTs && (
              <DropsInCommon
                onActive={handleDropActive}
                inCommon={inCommon}
                drops={drops}
                baseDropIds={dropIds}
                dropsEnsNames={dropsEnsNames}
              />
            )}
          </>
        )}
      </div>
    </Page>
  )
}

export default Drop
