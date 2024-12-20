import { useContext, useEffect, useMemo, useState } from 'react'
import { Link, useLoaderData, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { formatStat } from 'utils/number'
import { HTMLContext } from 'stores/html'
import { ReverseEnsContext } from 'stores/ethereum'
import { mergeAllInCommon } from 'models/in-common'
import { Drop, parseDrops, parseDropIds } from 'models/drop'
import { EnsByAddress } from 'models/ethereum'
import { InCommon } from 'models/api'
import { union, uniq } from 'utils/array'
import { formatDate } from 'utils/date'
import useEventsOwnersAndMetrics from 'hooks/useEventsOwnersAndMetrics'
import useEventsInCommon from 'hooks/useEventsInCommon'
import useEventsCollections from 'hooks/useEventsCollections'
import Timestamp from 'components/Timestamp'
import Card from 'components/Card'
import EventButtonGroup from 'components/EventButtonGroup'
import Page from 'components/Page'
import TokenImageZoom from 'components/TokenImageZoom'
import Status from 'components/Status'
import Loading from 'components/Loading'
import ShadowText from 'components/ShadowText'
import ButtonLink from 'components/ButtonLink'
import Progress from 'components/Progress'
import EventsInCommon from 'components/EventsInCommon'
import CollectionSet from 'components/CollectionSet'
import EventsOwners from 'components/EventsOwners'
import Switch from 'components/Switch'
import WarningIcon from 'components/WarningIcon'
import WarningMessage from 'components/WarningMessage'
import ErrorMessage from 'components/ErrorMessage'
import ButtonDelete from 'components/ButtonDelete'
import 'styles/events.css'

function Events() {
  const navigate = useNavigate()
  const { eventIds: rawDropIds } = useParams()
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
    completedDropsOwnersAndMetrics,
    loadingDropsOwnersAndMetrics,
    loadingOwnersAndMetricsDrops,
    dropsOwnersAndMetricsErrors,
    dropsOwners,
    dropsMetrics,
    fetchDropsOwnersAndMetrics,
    retryEventOwnersAndMetrics,
  } = useEventsOwnersAndMetrics(dropIds)

  const {
    completedDropsInCommon,
    completedInCommonDrops,
    loadingInCommonDrops,
    dropsInCommonErrors,
    loadedDropsInCommon,
    loadedDropsInCommonDrops,
    loadedDropsProgress,
    loadedDropsOwners,
    dropsInCommon,
    fetchDropsInCommon,
    retryDropAddressInCommon,
  } = useEventsInCommon(
    dropIds,
    dropsOwners,
    all,
    /*refresh*/force,
    /*local*/false,
    /*stream*/true
  )

  const {
    loadingCollections,
    collectionsError,
    collections,
    relatedCollections,
    fetchEventsCollections,
  } = useEventsCollections(dropIds)

  useEffect(
    () => {
      setTitle(Object.values(drops).map((event) => event.name).join(', '))
    },
    [drops, setTitle]
  )

  useEffect(
    () => {
      resolveEnsNames(
        uniq(union(...Object.values(dropsOwners)))
      )
    },
    [dropsOwners, resolveEnsNames]
  )

  useEffect(
    () => {
      const cancelEventsOwnersAndMetrics = fetchDropsOwnersAndMetrics()
      return () => {
        cancelEventsOwnersAndMetrics()
      }
    },
    [fetchDropsOwnersAndMetrics]
  )

  useEffect(
    () => {
      let cancelEventsInCommon: () => void | undefined
      if (completedDropsOwnersAndMetrics) {
        cancelEventsInCommon = fetchDropsInCommon()
      }
      return () => {
        if (cancelEventsInCommon) {
          cancelEventsInCommon()
        }
      }
    },
    [completedDropsOwnersAndMetrics, fetchDropsInCommon]
  )

  useEffect(
    () => {
      let cancelEventsCollections: () => void | undefined
      if (completedDropsInCommon) {
        cancelEventsCollections = fetchEventsCollections()
      }
      return () => {
        if (cancelEventsCollections) {
          cancelEventsCollections()
        }
      }
    },
    [
      completedDropsInCommon,
      fetchEventsCollections,
    ]
  )

  function delDrop(dropId: number): void {
    const newDropIds = parseDropIds(String(rawDropIds)).filter(
      (paramEventId) => String(paramEventId) !== String(dropId)
    )
    if (newDropIds.length === 1) {
      navigate(`/event/${newDropIds[0]}`)
    } else if (newDropIds.length > 0) {
      navigate(`/events/${newDropIds.join(',')}`)
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
            loadedDropsOwners[dropId] == null ||
            dropsOwners[dropId] == null ||
            dropsInCommon[dropId] == null ||
            dropsInCommon[dropId].inCommon[dropId] == null ||
            (
              loadedDropsOwners[dropId] !== dropsOwners[dropId].length &&
              dropsInCommon[dropId].inCommon[dropId].length !== dropsOwners[dropId].length
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
      dropsOwners,
      completedDropsInCommon,
      loadedDropsOwners,
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
        setDropsEnsNames((prevEventsEnsNames) => ({
          ...prevEventsEnsNames,
          [dropId]: ensNames,
        }))
      })
    }
  }

  return (
    <Page>
      <div className="events">
        <div className="events-table">
          <Card>
            <table>
              <thead>
                <tr>
                  <th className="event-head" align="left">Drop</th>
                  <th>Collectors</th>
                  <th></th>
                  <th></th>
                  <th className="event-head-actions">
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
                    <td className="event-cell-info">
                      <div className="event-image">
                        <TokenImageZoom
                          drop={drop}
                          zoomSize={512}
                          size={48}
                        />
                        <Link
                          to={`/event/${drop.id}`}
                          className="event-id"
                        >
                          #{drop.id}
                        </Link>
                      </div>
                      <div className="event-data">
                        <h2>{drop.name}</h2>
                        <div className="event-date">
                          {formatDate(drop.start_date)}
                        </div>
                        {drop.city && drop.country && (
                          <div className="place">
                            {drop.city}, {drop.country}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="event-cell-metrics">
                      {(
                        loadingDropsOwnersAndMetrics ||
                        loadingOwnersAndMetricsDrops[drop.id] != null
                      ) && (
                        <Loading small={true} />
                      )}
                      {dropsOwners[drop.id] != null && (
                        <ShadowText grow={true} medium={true}>
                          {formatStat(dropsOwners[drop.id].length)}
                          {(
                            dropsMetrics[drop.id] != null &&
                            dropsMetrics[drop.id].emailReservations > 0
                          ) && (
                            ` + ${formatStat(dropsMetrics[drop.id].emailReservations)}`
                          )}
                        </ShadowText>
                      )}
                    </td>
                    <td className="event-cell-status">
                      <Status
                        loading={
                          loadingInCommonDrops[drop.id]
                        }
                        error={
                          dropsOwnersAndMetricsErrors[drop.id] != null ||
                          dropsInCommonErrors[drop.id] != null
                        }
                      />
                      {dropsOwnersAndMetricsErrors[drop.id] != null && (
                        <>
                          <span
                            className="status-error-message"
                            title={dropsOwnersAndMetricsErrors[drop.id].cause
                              ? `${dropsOwnersAndMetricsErrors[drop.id].cause}`
                              : undefined}
                          >
                            {dropsOwnersAndMetricsErrors[drop.id].message}
                          </span>
                          {' '}
                          <ButtonLink
                            onClick={() => retryEventOwnersAndMetrics(drop.id)}
                          >
                            retry
                          </ButtonLink>
                        </>
                      )}
                    </td>
                    <td className="event-cell-progress">
                      {(
                        loadingInCommonDrops[drop.id] != null &&
                        loadedDropsInCommon[drop.id] == null &&
                        loadedDropsInCommonDrops[drop.id] == null &&
                        loadedDropsProgress[drop.id] == null &&
                        loadedDropsOwners[drop.id] != null &&
                        dropsOwners[drop.id] != null
                      ) && (
                        <Progress
                          value={loadedDropsOwners[drop.id]}
                          max={dropsOwners[drop.id].length}
                          showValue={loadedDropsOwners[drop.id] > 0}
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
                            dropsOwners[drop.id] != null &&
                            dropsInCommon[drop.id] != null &&
                            dropsInCommon[drop.id].inCommon[drop.id] != null &&
                            dropsInCommon[drop.id].inCommon[drop.id].length !== dropsOwners[drop.id].length
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
                    <td className="event-cell-actions">
                      <EventButtonGroup
                        drop={drop}
                        right={true}
                        viewInGallery={true}
                      >
                        <ButtonDelete
                          onDelete={() => delDrop(drop.id)}
                          title={`Removes drop #${drop.id}`}
                        />
                      </EventButtonGroup>
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
        {!completedDropsOwnersAndMetrics && !completedDropsInCommon && (
          <Card shink={true}>
            <Loading title="Loading collectors and metrics" />
          </Card>
        )}
        {completedDropsOwnersAndMetrics && !completedDropsInCommon && (
          <Card shink={true}>
            <Loading
              title="Loading drops"
              count={Object.values(loadedDropsOwners).length}
              total={dropIds.length}
            />
          </Card>
        )}
        {completedDropsInCommon && (
          <>
            {loadingCollections && !collectionsError && (
              <Card>
                <h4>Collections</h4>
                <Loading />
              </Card>
            )}
            {!loadingCollections && collectionsError && (
              <Card>
                <h4>Collections</h4>
                <ErrorMessage error={collectionsError} />
              </Card>
            )}
            {(
              !loadingCollections &&
              !collectionsError &&
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
            <EventsOwners
              dropsOwners={dropsOwners}
              inCommon={inCommon}
              drops={allDrops}
              all={all}
            />
            <EventsInCommon
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

export default Events
