import { useContext, useEffect, useMemo, useState } from 'react'
import { useLoaderData, useSearchParams } from 'react-router-dom'
import { HTMLContext } from 'stores/html'
import { ReverseEnsContext } from 'stores/ethereum'
import { parseDrop } from 'models/drop'
import { EnsByAddress } from 'models/ethereum'
import useEventInCommon from 'hooks/useEventInCommon'
import useDropsCollectors from 'hooks/useDropsCollectors'
import useDropsMetrics from 'hooks/useDropsMetrics'
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
import 'styles/drop.css'

function Drop() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { setTitle } = useContext(HTMLContext)
  const { resolveEnsNames } = useContext(ReverseEnsContext)
  const loaderData = useLoaderData()
  const [dropsEnsNames, setDropsEnsNames] = useState<Record<number, EnsByAddress>>({})

  const force = searchParams.get('force') === 'true'

  const drop = useMemo(
    () => parseDrop(
      loaderData,
      /*includeDescription*/true,
    ),
    [loaderData]
  )

  const dropIds = useMemo(
    () => [drop.id],
    [drop]
  )

  const {
    completed: completedCollectors,
    loading: loadingCollectors,
    errors: errorsCollectorsByDrop,
    dropsCollectors,
    fetchDropsCollectors,
    retryDropCollectors,
  } = useDropsCollectors(dropIds)

  const collectors = useMemo(
    () => dropsCollectors[drop.id],
    [dropsCollectors, drop.id]
  )

  const {
    completed: completedMetrics,
    loading: loadingMetrics,
    errors: errorsMetricsByDrop,
    dropsMetrics,
    fetchDropsMetrics,
    retryDropMetrics,
  } = useDropsMetrics(dropIds)

  const metrics = useMemo(
    () => dropsMetrics[drop.id],
    [dropsMetrics, drop.id]
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
      const cancelDropsCollectors = fetchDropsCollectors()
      return () => {
        cancelDropsCollectors()
      }
    },
    [
      fetchDropsCollectors,
    ]
  )

  useEffect(
    () => {
      const cancelDropsMetrics = fetchDropsMetrics()
      return () => {
        cancelDropsMetrics()
      }
    },
    [
      fetchDropsMetrics,
    ]
  )

  useEffect(
    () => {
      if (completedCollectors) {
        resolveEnsNames(collectors)
      }
    },
    [
      completedCollectors,
      collectors,
      resolveEnsNames,
    ]
  )

  useEffect(
    () => {
      let cancelDropInCommon: () => void | undefined
      if (completedCollectors) {
        cancelDropInCommon = fetchDropInCommon()
      }
      return () => {
        if (cancelDropInCommon) {
          cancelDropInCommon()
        }
      }
    },
    [
      completedCollectors,
      fetchDropInCommon,
    ]
  )

  useEffect(
    () => {
      let cancelDropsCollections: () => void | undefined
      if (
        metrics != null &&
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

  useEffect(
    () => {
      setTitle(drop.name)
    },
    [drop.name, setTitle]
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
      <div className="drop">
        <div className="drop-header-info">
          <DropInfo drop={drop}>
            {loadingMetrics && (
              <Loading />
            )}
            {
              completedMetrics &&
              metrics != null &&
              (
                <DropStats
                  drop={drop}
                  metrics={metrics}
                />
              )
            }
            <DropButtonGroup drop={drop} viewInGallery={true}>
              {collectors != null && (
                <ButtonExportAddressCsv
                  filename={`collectors-${drop.id}`}
                  name={drop.name}
                  addresses={collectors}
                  title={
                    `Generates CSV file with collectors of drop #${drop.id}`
                  }
                />
              )}
              <DropButtonMoments drop={drop} />
            </DropButtonGroup>
            {cachedTs && (
              <div className="cached">
                Cached <Timestamp ts={cachedTs} />,{' '}
                <ButtonLink onClick={() => refreshCache()}>refresh</ButtonLink>.
              </div>
            )}
          </DropInfo>
        </div>
        {loadingCollectors && (
          <Card>
            <Loading />
          </Card>
        )}
        {loadingDropInCommon && (
          <Card>
            {loadedCollectors > 0
              ? <Loading count={loadedCollectors} total={metrics.mints} />
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
            {errorsCollectorsByDrop != null && errorsCollectorsByDrop[drop.id] && (
              <ErrorMessage error={errorsCollectorsByDrop[drop.id]}>
                <ButtonLink onClick={() => retryDropCollectors(drop.id)}>retry</ButtonLink>
              </ErrorMessage>
            )}
            {errorsMetricsByDrop != null && errorsMetricsByDrop[drop.id] && (
              <ErrorMessage error={errorsMetricsByDrop[drop.id]}>
                <ButtonLink onClick={() => retryDropMetrics(drop.id)}>retry</ButtonLink>
              </ErrorMessage>
            )}
            {collectorsErrors != null && collectorsErrors.length > 0 && (
              <AddressErrorList
                errors={collectorsErrors}
                onRetry={retryAddress}
              />
            )}
          </Card>
        )}
        {!loadingDropInCommon && (
          <>
            {(
              completedMetrics &&
              metrics != null &&
              cachedTs &&
              drop.id in inCommon &&
              inCommon[drop.id].length !== metrics.mints
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
