import { useContext, useEffect, useMemo } from 'react'
import { Link, useLoaderData, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { formatStat } from 'utils/number'
import { HTMLContext } from 'stores/html'
import { useEns } from 'stores/ethereum'
import { InCommon, mergeAllInCommon } from 'models/in-common'
import { parseDrops, parseDropIds, joinDropIds } from 'models/drop'
import { union, uniq } from 'utils/array'
import { formatDate } from 'utils/date'
import useDropsCollectors from 'hooks/useDropsCollectors'
import useDropsMetrics from 'hooks/useDropsMetrics'
import useEventsInCommon from 'hooks/useEventsInCommon'
import useDropsCollections from 'hooks/useDropsCollections'
import Timestamp from 'components/Timestamp'
import Card from 'components/Card'
import DropButtonGroup from 'components/DropButtonGroup'
import Page from 'components/Page'
import TokenImageZoom from 'components/TokenImageZoom'
import Status from 'components/Status'
import StatusErrorMessage from 'components/StatusErrorMessage'
import Loading from 'components/Loading'
import ShadowText from 'components/ShadowText'
import ButtonLink from 'components/ButtonLink'
import Progress from 'components/Progress'
import DropsInCommon from 'components/DropsInCommon'
import CollectionSet from 'components/CollectionSet'
import DropsCollectors from 'components/DropsCollectors'
import WarningIcon from 'components/WarningIcon'
import WarningMessage from 'components/WarningMessage'
import ErrorMessage from 'components/ErrorMessage'
import ButtonDelete from 'components/ButtonDelete'
import 'styles/drops.css'

function Drops() {
  const navigate = useNavigate()
  const { dropIds: rawDropIds } = useParams()
  const [searchParams, setSearchParams] = useSearchParams({ all: 'false' })
  const { setTitle } = useContext(HTMLContext)
  const { resolveEnsNames } = useEns()
  const loaderData = useLoaderData()

  const force = searchParams.get('force') === 'true'

  const drops = useMemo(
    () => parseDrops(loaderData, /*includeDescription*/false),
    [loaderData]
  )

  const dropIds = useMemo(
    () => Object.keys(drops).map((rawDropId) => parseInt(rawDropId)),
    [drops]
  )

  const {
    completed: completedCollectors,
    loading: loadingCollectors,
    loadingDrops: loadingCollectorsByDrop,
    errors: errorsCollectorsByDrop,
    dropsCollectors,
    fetchDropsCollectors,
    retryDropCollectors,
  } = useDropsCollectors(dropIds)

  const {
    completed: completedMetrics,
    loading: loadingMetrics,
    loadingDrops: loadingMetricsByDrop,
    errors: errorsMetricsByDrop,
    dropsMetrics,
    fetchDropsMetrics,
    retryDropMetrics,
  } = useDropsMetrics(dropIds)

  const {
    completedDropsInCommon,
    completedInCommonDrops,
    loadingInCommonDrops,
    dropsInCommonErrors,
    loadedDropsInCommon,
    loadedDropsProgress,
    loadedDropsCollectors,
    dropsInCommon,
    fetchDropsInCommon,
    retryDropAddressInCommon,
  } = useEventsInCommon(
    dropIds,
    dropsCollectors,
    /*all*/true,
    /*refresh*/force,
    /*local*/false,
    /*stream*/true
  )

  const {
    loading: loadingCollections,
    error: errorCollections,
    collections,
    relatedCollections,
    fetchDropsCollections,
  } = useDropsCollections(dropIds)

  useEffect(
    () => {
      setTitle(Object.values(drops).map((drop) => drop.name).join(', '))
    },
    [drops, setTitle]
  )

  useEffect(
    () => {
      if (dropsCollectors == null) {
        return
      }

      resolveEnsNames(
        uniq(union(...Object.values(dropsCollectors)))
      )
    },
    [dropsCollectors, resolveEnsNames]
  )

  useEffect(
    () => {
      const cancelDropsCollectors = fetchDropsCollectors()

      return () => {
        cancelDropsCollectors()
      }
    },
    [fetchDropsCollectors]
  )

  useEffect(
    () => {
      const cancelDropsMetrics = fetchDropsMetrics()

      return () => {
        cancelDropsMetrics()
      }
    },
    [fetchDropsMetrics]
  )

  useEffect(
    () => {
      let cancelDropsInCommon: () => void | undefined

      if (completedCollectors && completedMetrics) {
        cancelDropsInCommon = fetchDropsInCommon()
      }

      return () => {
        if (cancelDropsInCommon) {
          cancelDropsInCommon()
        }
      }
    },
    [completedCollectors, completedMetrics, fetchDropsInCommon]
  )

  useEffect(
    () => {
      let cancelDropsCollections: () => void | undefined

      if (completedDropsInCommon) {
        cancelDropsCollections = fetchDropsCollections()
      }

      return () => {
        if (cancelDropsCollections) {
          cancelDropsCollections()
        }
      }
    },
    [
      completedDropsInCommon,
      fetchDropsCollections,
    ]
  )

  function delDrop(dropId: number): void {
    const newDropIds = parseDropIds(String(rawDropIds)).filter(
      (paramDropId) => String(paramDropId) !== String(dropId)
    )
    if (newDropIds.length === 1) {
      navigate(`/drop/${newDropIds[0]}`)
    } else if (newDropIds.length > 0) {
      navigate(`/drops/${joinDropIds(newDropIds)}`)
    } else {
      navigate('/')
    }
  }

  const inCommon: InCommon = useMemo(
    () => {
      if (!completedDropsInCommon) {
        return {}
      }
      return mergeAllInCommon(
        Object.values(dropsInCommon).map(
          (oneEventData) => oneEventData?.inCommon ?? {}
        ),
        /*all*/true
      )
    },
    [completedDropsInCommon, dropsInCommon]
  )

  const staleDrops = useMemo(
    () => {
      if (!completedDropsInCommon) {
        return 0
      }
      return dropIds.reduce(
        (total, dropId) => {
          if (
            loadedDropsCollectors[dropId] == null ||
            dropsCollectors[dropId] == null ||
            dropsInCommon[dropId] == null ||
            dropsInCommon[dropId].inCommon[dropId] == null ||
            (
              loadedDropsCollectors[dropId] !== dropsCollectors[dropId].length &&
              dropsInCommon[dropId].inCommon[dropId].length !== dropsCollectors[dropId].length
            )
          ) {
            return total + 1
          }
          return total
        },
        0
      )
    },
    [
      dropIds,
      dropsCollectors,
      completedDropsInCommon,
      loadedDropsCollectors,
      dropsInCommon,
    ]
  )

  const refreshCache = (): void => {
    setSearchParams({ force: 'true' })
  }

  const handleDropActive = (dropId: number): void => {
    const addresses = inCommon[dropId]

    if (addresses != null && addresses.length > 0) {
      resolveEnsNames(addresses)
    }
  }

  return (
    <Page>
      <div className="drops">
        <div className="drops-table">
          <Card>
            <table>
              <thead>
                <tr>
                  <th className="drop-head" align="left">Drop</th>
                  <th>Collectors</th>
                  <th></th>
                  <th></th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {Object.values(drops).map((drop) => (
                  <tr key={drop.id}>
                    <td className="drop-cell-info">
                      <div className="drop-image">
                        <TokenImageZoom
                          drop={drop}
                          zoomSize={512}
                          size={48}
                        />
                        <Link
                          to={`/drop/${drop.id}`}
                          className="drop-id"
                        >
                          #{drop.id}
                        </Link>
                      </div>
                      <div className="drop-data">
                        <h2>{drop.name}</h2>
                        <div className="drop-date">
                          {formatDate(drop.start_date)}
                        </div>
                        {drop.city && drop.country && (
                          <div className="drop-place">
                            {drop.city}, {drop.country}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="drop-cell-metrics">
                      {(loadingMetrics || loadingMetricsByDrop[drop.id]) && (
                        <Loading size="small" />
                      )}
                      {dropsMetrics != null && dropsMetrics[drop.id] != null && (
                        <ShadowText grow={true} medium={true}>
                          {formatStat(dropsMetrics[drop.id].mints)}
                          {dropsMetrics[drop.id].emailReservations > 0 && (
                            ` + ${formatStat(dropsMetrics[drop.id].emailReservations)}`
                          )}
                        </ShadowText>
                      )}
                    </td>
                    <td className="drop-cell-status">
                      <Status
                        loading={
                          loadingInCommonDrops[drop.id]
                        }
                        error={
                          errorsCollectorsByDrop[drop.id] != null ||
                          errorsMetricsByDrop[drop.id] != null ||
                          dropsInCommonErrors[drop.id] != null
                        }
                      />
                      {errorsCollectorsByDrop[drop.id] != null && (
                        <StatusErrorMessage
                          error={errorsCollectorsByDrop[drop.id]}
                          onRetry={() => retryDropCollectors(drop.id)}
                        />
                      )}
                      {errorsMetricsByDrop[drop.id] != null && (
                        <StatusErrorMessage
                          error={errorsMetricsByDrop[drop.id]}
                          onRetry={() => retryDropMetrics(drop.id)}
                        />
                      )}
                    </td>
                    <td className="drop-cell-progress">
                      {(
                        (loadingCollectors || loadingCollectorsByDrop[drop.id]) &&
                        (!loadingMetrics && !loadingMetricsByDrop[drop.id])
                      ) && (
                        <Loading size="small" />
                      )}
                      {(
                        loadingInCommonDrops[drop.id] != null &&
                        loadedDropsInCommon[drop.id] == null &&
                        loadedDropsProgress[drop.id] == null &&
                        loadedDropsCollectors[drop.id] != null &&
                        dropsCollectors[drop.id] != null
                      ) && (
                        <Progress
                          value={loadedDropsCollectors[drop.id]}
                          max={dropsCollectors[drop.id].length}
                          showValue={loadedDropsCollectors[drop.id] > 0}
                        />
                      )}
                      {(
                        loadedDropsInCommon[drop.id] != null &&
                        loadedDropsProgress[drop.id] == null
                       ) && (
                        <Progress
                          value={loadedDropsInCommon[drop.id].count}
                          max={loadedDropsInCommon[drop.id].total}
                          maxFinal={loadedDropsInCommon[drop.id].totalFinal}
                          showValue={loadedDropsInCommon[drop.id].total > 0}
                        />
                      )}
                      {(
                        loadedDropsInCommon[drop.id] == null &&
                        loadedDropsProgress[drop.id] != null
                       ) && (
                        <Progress
                          value={loadedDropsProgress[drop.id].progress}
                          max={1}
                          showPercent={true}
                          eta={loadedDropsProgress[drop.id].estimated}
                          rate={loadedDropsProgress[drop.id].rate}
                        />
                      )}
                      {dropsInCommonErrors[drop.id] != null && Object.entries(
                        dropsInCommonErrors[drop.id]
                      ).map(
                        ([address, error]) => (
                          <p key={address} className="address-error-message">
                            <code>[{address}]</code>{' '}
                            <span
                              title={error.cause ? `${error.cause}` : undefined}
                            >
                              {error.message}
                            </span>{' '}
                            <ButtonLink
                              onClick={() => {
                                retryDropAddressInCommon(drop.id, address)
                              }}
                            >
                              retry
                            </ButtonLink>
                          </p>
                        )
                      )}
                      {(
                        dropsInCommon[drop.id] != null &&
                        dropsInCommon[drop.id].ts != null
                      ) && (
                        <p className="status-cached-ts">
                          Cached <Timestamp ts={dropsInCommon[drop.id].ts} />
                          {(
                            completedInCommonDrops[drop.id] &&
                            dropsCollectors[drop.id] != null &&
                            dropsInCommon[drop.id] != null &&
                            dropsInCommon[drop.id].inCommon[drop.id] != null &&
                            dropsInCommon[drop.id].inCommon[drop.id].length !== dropsCollectors[drop.id].length
                          ) && (
                            <>
                              {' '}
                              <WarningIcon
                                title="There have been new mints since this POAP was cached"
                              />
                            </>
                          )}
                        </p>
                      )}
                    </td>
                    <td className="drop-cell-actions">
                      <DropButtonGroup
                        dropId={drop.id}
                        right={true}
                        viewInGallery={true}
                      >
                        <ButtonDelete
                          onDelete={() => delDrop(drop.id)}
                          title={`Removes drop #${drop.id}`}
                        />
                      </DropButtonGroup>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
        {staleDrops > 0 && (
          <WarningMessage>
            There have been new mints in {staleDrops}{' '}
            POAP{staleDrops === 1 ? '' : 's'} since cached,{' '}
            <ButtonLink onClick={() => refreshCache()}>refresh all</ButtonLink>.
          </WarningMessage>
        )}
        {loadingMetrics && !completedDropsInCommon && (
          <Card shink={true}>
            <Loading size="big" title="Loading metrics" />
          </Card>
        )}
        {loadingCollectors && !loadingMetrics && !completedDropsInCommon && (
          <Card shink={true}>
            <Loading size="big" title="Loading collectors" />
          </Card>
        )}
        {completedCollectors && completedMetrics && !completedDropsInCommon && (
          <Card shink={true}>
            <Loading
              size="big"
              title="Loading drops"
              count={Object.values(loadedDropsCollectors).length}
              total={dropIds.length}
            />
          </Card>
        )}
        {completedDropsInCommon && (
          <>
            {loadingCollections && !errorCollections && (
              <Card>
                <h4>Collections</h4>
                <Loading size="big" />
              </Card>
            )}
            {!loadingCollections && errorCollections && (
              <Card>
                <h4>Collections</h4>
                <ErrorMessage error={errorCollections} />
              </Card>
            )}
            {(
              !loadingCollections &&
              !errorCollections &&
              collections != null &&
              relatedCollections != null
            ) && (
              <CollectionSet
                showEmpty={false}
                collectionMap={{
                  [`${collections.length} collections`]: collections,
                  [`${relatedCollections.length} related collections`]: relatedCollections,
                }}
              />
            )}
            <DropsCollectors
              dropsCollectors={dropsCollectors}
              inCommon={inCommon}
            />
            <DropsInCommon
              onActive={handleDropActive}
              inCommon={inCommon}
              baseDropIds={dropIds}
            />
          </>
        )}
      </div>
    </Page>
  )
}

export default Drops
