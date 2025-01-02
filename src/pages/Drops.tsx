import { useContext, useEffect, useMemo, useState } from 'react'
import { Link, useLoaderData, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { formatStat } from 'utils/number'
import { HTMLContext } from 'stores/html'
import { ReverseEnsContext } from 'stores/ethereum'
import { InCommon, mergeAllInCommon } from 'models/in-common'
import { Drop, parseDrops, parseDropIds, joinDropIds } from 'models/drop'
import { EnsByAddress } from 'models/ethereum'
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
import Loading from 'components/Loading'
import ShadowText from 'components/ShadowText'
import ButtonLink from 'components/ButtonLink'
import Progress from 'components/Progress'
import DropsInCommon from 'components/DropsInCommon'
import CollectionSet from 'components/CollectionSet'
import DropsCollectors from 'components/DropsCollectors'
import Switch from 'components/Switch'
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
  const { resolveEnsNames } = useContext(ReverseEnsContext)
  const loaderData = useLoaderData()
  const [dropsEnsNames, setDropsEnsNames] = useState<Record<number, EnsByAddress>>({})

  const force = searchParams.get('force') === 'true'
  const all = searchParams.get('all') === 'true'

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
  }= useDropsMetrics(dropIds)

  const {
    completedDropsInCommon,
    completedInCommonDrops,
    loadingInCommonDrops,
    dropsInCommonErrors,
    loadedDropsInCommon,
    loadedDropsInCommonDrops,
    loadedDropsProgress,
    loadedDropsCollectors,
    dropsInCommon,
    fetchDropsInCommon,
    retryDropAddressInCommon,
  } = useEventsInCommon(
    dropIds,
    dropsCollectors,
    all,
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

  function handleAllChange(checked: boolean): void {
    setSearchParams({ all: checked ? 'true' : 'false' })
  }

  function handleViewAll(): void {
    setSearchParams({ all: 'true' })
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
        all
      )
    },
    [completedDropsInCommon, dropsInCommon, all]
  )

  const allDrops: Record<number, Drop> = useMemo(
    () => Object.values(dropsInCommon).reduce(
      (allDrops, data) => ({
        ...allDrops,
        ...data.events,
      }),
      {}
    ),
    [dropsInCommon]
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

  function refreshCache(): void {
    setSearchParams({ force: 'true' })
  }

  function sumCollectionsIncludes(): number {
    if (typeof dropsMetrics !== 'object') {
      return 0
    }
    return Object.values(dropsMetrics).reduce(
      (total, metric) => total + metric.collectionsIncludes,
      0
    )
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
                  <th className="drop-head-actions">
                    <span>In Common</span>
                    <Switch
                      id="all"
                      checked={all}
                      onChange={handleAllChange}
                      labelOn="X"
                      labelOff="X"
                    />
                    <span>All</span>
                  </th>
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
                      {(
                        loadingCollectors ||
                        loadingMetrics ||
                        loadingCollectorsByDrop[drop.id] != null ||
                        loadingMetricsByDrop[drop.id] != null
                      ) && (
                        <Loading small={true} />
                      )}
                      {dropsCollectors[drop.id] != null && (
                        <ShadowText grow={true} medium={true}>
                          {formatStat(dropsCollectors[drop.id].length)}
                          {(
                            dropsMetrics[drop.id] != null &&
                            dropsMetrics[drop.id].emailReservations > 0
                          ) && (
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
                        <>
                          <span
                            className="status-error-message"
                            title={errorsCollectorsByDrop[drop.id].cause
                              ? `${errorsCollectorsByDrop[drop.id].cause}`
                              : undefined}
                          >
                            {errorsCollectorsByDrop[drop.id].message}
                          </span>
                          {' '}
                          <ButtonLink
                            onClick={() => retryDropCollectors(drop.id)}
                          >
                            retry
                          </ButtonLink>
                        </>
                      )}
                      {errorsMetricsByDrop[drop.id] != null && (
                        <>
                          <span
                            className="status-error-message"
                            title={errorsMetricsByDrop[drop.id].cause
                              ? `${errorsMetricsByDrop[drop.id].cause}`
                              : undefined}
                          >
                            {errorsMetricsByDrop[drop.id].message}
                          </span>
                          {' '}
                          <ButtonLink
                            onClick={() => retryDropMetrics(drop.id)}
                          >
                            retry
                          </ButtonLink>
                        </>
                      )}
                    </td>
                    <td className="drop-cell-progress">
                      {(
                        loadingInCommonDrops[drop.id] != null &&
                        loadedDropsInCommon[drop.id] == null &&
                        loadedDropsInCommonDrops[drop.id] == null &&
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
                        loadedDropsInCommonDrops[drop.id] == null &&
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
                        loadedDropsInCommon[drop.id] != null &&
                        loadedDropsInCommonDrops[drop.id] != null &&
                        loadedDropsProgress[drop.id] == null
                       ) && (
                        <Progress
                          value={loadedDropsInCommonDrops[drop.id].count}
                          max={loadedDropsInCommonDrops[drop.id].total}
                          showValue={loadedDropsInCommonDrops[drop.id].total > 0}
                        />
                      )}
                      {(
                        loadedDropsInCommon[drop.id] == null &&
                        loadedDropsInCommonDrops[drop.id] == null &&
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
                        drop={drop}
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
        {(loadingCollectors || loadingMetrics) && !completedDropsInCommon && (
          <Card shink={true}>
            <Loading title="Loading collectors and metrics" />
          </Card>
        )}
        {completedCollectors && completedMetrics && !completedDropsInCommon && (
          <Card shink={true}>
            <Loading
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
                <Loading />
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
                showEmpty={sumCollectionsIncludes() > 0}
                emptyMessage={(
                  <>
                    No collections found that includes exactly all{' '}
                    {Object.keys(drops).length} POAPs,{' '}
                    <ButtonLink onClick={handleViewAll}>
                      view related collections
                    </ButtonLink>.
                  </>
                )}
                collectionMap={{
                  [`${collections.length} collections`]: collections,
                  [`${relatedCollections.length} related collections`]: all ? relatedCollections : [],
                }}
              />
            )}
            <DropsCollectors
              dropsCollectors={dropsCollectors}
              inCommon={inCommon}
              drops={allDrops}
              all={all}
            />
            <DropsInCommon
              onActive={handleDropActive}
              inCommon={inCommon}
              drops={allDrops}
              baseDropIds={dropIds}
              dropsEnsNames={dropsEnsNames}
            />
          </>
        )}
      </div>
    </Page>
  )
}

export default Drops
