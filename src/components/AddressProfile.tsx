import { Fragment, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { clsx } from 'clsx'
import { formatMonthYear } from 'utils/date'
import { findInitialPOAPDate } from 'models/poap'
import {
  INCOMMON_ADDRESSES_LIMIT,
  INCOMMON_DROPS_LIMIT,
} from 'models/in-common'
import { POAP_PROFILE_LIMIT } from 'models/poap'
import { useEns } from 'stores/ethereum'
import { useDrops } from 'stores/drops'
import useAddressTokens from 'hooks/useAddressTokens'
import EnsAvatar from 'components/EnsAvatar'
import LinkToScan from 'components/LinkToScan'
import AddressesList from 'components/AddressesList'
import TokenImage from 'components/TokenImage'
import ButtonLink from 'components/ButtonLink'
import ErrorMessage from 'components/ErrorMessage'
import Loading from 'components/Loading'
import 'styles/address-profile.css'

function AddressProfile({
  ens,
  address,
  inCommonDropIds = [],
  inCommonAddresses = [],
}: {
  ens?: string
  address: string
  inCommonDropIds?: number[]
  inCommonAddresses?: string[]
}) {
  const { getEnsName } = useEns()

  const [showAllPOAPs, setShowAllPOAPs] = useState<boolean>(false)
  const [showAllInCommonDrops, setShowAllInCommonDrops] = useState<boolean>(false)
  const [showAllInCommonAddresses, setShowAllInCommonAddresses] = useState<boolean>(false)

  const {
    loadingAddressTokens,
    addressTokensError,
    tokens: poaps,
    fetchTokens,
  } = useAddressTokens(address)

  const poapsTotal = poaps == null ? 0 : poaps.length
  const poapsHasMore = poapsTotal > POAP_PROFILE_LIMIT

  let poapsVisible = poaps == null ? [] : poaps.slice()
  if (poapsHasMore && !showAllPOAPs) {
    poapsVisible = poapsVisible.slice(0, POAP_PROFILE_LIMIT)
  }

  const inCommonDropsTotal = useMemo(
    () => inCommonDropIds == null ? 0 : inCommonDropIds.length,
    [inCommonDropIds]
  )

  const inCommonDropsHasMore = useMemo(
    () => inCommonDropsTotal > INCOMMON_DROPS_LIMIT,
    [inCommonDropsTotal]
  )

  const inCommonDropIdsVisible = useMemo(
    () => {
      let inCommonDropIdsVisible = inCommonDropIds == null ? [] : inCommonDropIds.slice()
      if (inCommonDropsHasMore && !showAllInCommonDrops) {
        inCommonDropIdsVisible = inCommonDropIdsVisible.slice(0, INCOMMON_DROPS_LIMIT)
      }
      return inCommonDropIdsVisible
    },
    [inCommonDropIds, inCommonDropsHasMore, showAllInCommonDrops]
  )

  const inCommonAddressesTotal = inCommonAddresses == null ? 0 : inCommonAddresses.length
  const inCommonAddressesHasMore = inCommonAddressesTotal > INCOMMON_ADDRESSES_LIMIT

  let inCommonAddressesVisible = inCommonAddresses == null ? [] : inCommonAddresses.slice()
  if (inCommonAddressesHasMore && !showAllInCommonAddresses) {
    inCommonAddressesVisible = inCommonAddressesVisible.slice(0, INCOMMON_ADDRESSES_LIMIT)
  }

  const { loading, error, errors, drops } = useDrops()

  useEffect(
    () => {
      const cancelFetchTokens = fetchTokens()

      return () => {
        cancelFetchTokens()
      }
    },
    [fetchTokens]
  )

  const since = useMemo(
    () => {
      if (poaps == null) {
        return null
      }
      return findInitialPOAPDate(poaps)
    },
    [poaps]
  )

  const ensName = ens ?? getEnsName(address)

  return (
    <div className="address-profile">
      {loadingAddressTokens && (
        <Loading size="small" />
      )}
      {addressTokensError && (
        <ErrorMessage error={addressTokensError} />
      )}
      {!loadingAddressTokens && !addressTokensError && (
        <>
          {ensName != null && (
            <EnsAvatar ens={ensName} />
          )}
          <LinkToScan
            className="profile-address"
            address={address}
            showEns={false}
          />
          {ensName && (
            <big className="profile-ens">{ensName}</big>
          )}
          {poaps != null && Array.isArray(poaps) && poaps.length > 0 && (
            <div className={clsx('profile-poaps', showAllPOAPs && 'show-all')}>
              <h4>{poapsTotal} collected drops
                {since && (
                  <span className="profile-since">
                    {' '}since
                    {' '}{formatMonthYear(since)}
                  </span>
                )}
              </h4>
              {poapsVisible.map((token) => (
                token.id && token.drop && (
                  <TokenImage
                    key={token.id}
                    drop={token.drop}
                    size={18}
                    resize={true}
                  />
                )
              ))}
              {poapsHasMore && (
                <div className="show-more">
                  <ButtonLink
                    onClick={() => {
                      setShowAllPOAPs((prevShowAll) => !prevShowAll)
                    }}
                  >
                    {showAllPOAPs
                      ? `show ${POAP_PROFILE_LIMIT}`
                      : `show all ${poapsTotal}`}
                  </ButtonLink>
                </div>
              )}
            </div>
          )}
          {Array.isArray(inCommonDropIds) && inCommonDropIds.length > 0 && (
            <div
              className={clsx('profile-in-common',
                showAllInCommonDrops && 'show-all',
              )}
            >
              <h4>{inCommonDropsTotal} in common drops</h4>
              {error && (
                <ErrorMessage error={error} />
              )}
              {inCommonDropIdsVisible.map((dropId) => (
                <Fragment key={dropId}>
                  {errors[dropId] && (
                    <ErrorMessage error={errors[dropId]} />
                  )}
                </Fragment>
              ))}
              {inCommonDropIdsVisible.map((dropId) => (
                <Fragment key={dropId}>
                  {!drops[dropId] && loading[dropId] && (
                    <Loading size="icon" />
                  )}
                  {drops[dropId] && (
                    <TokenImage
                      drop={drops[dropId]}
                      size={18}
                      resize={true}
                    />
                  )}
                </Fragment>
              ))}
              {inCommonDropsHasMore && (
                <div className="show-more">
                  <ButtonLink
                    onClick={() => {
                      setShowAllInCommonDrops((prevShowAll) => !prevShowAll)
                    }}
                  >
                    {showAllInCommonDrops
                      ? `show ${INCOMMON_DROPS_LIMIT}`
                      : `show all ${inCommonDropsTotal}`}
                  </ButtonLink>
                </div>
              )}
            </div>
          )}
          {Array.isArray(inCommonAddresses) && inCommonAddresses.length > 0 && (
            <div
              className={clsx('profile-in-common',
                showAllInCommonAddresses && 'show-all',
              )}
            >
              <h4>
                <Link to={`/addresses#${address},${inCommonAddresses.join(',')}`}>
                  {inCommonAddressesTotal} in common collectors
                </Link>
              </h4>
              <AddressesList
                addresses={inCommonAddressesVisible}
                addressToCompare={address}
              />
              {inCommonAddressesHasMore && (
                <div className="show-more">
                  <ButtonLink
                    onClick={() => {
                      setShowAllInCommonAddresses((prevShowAll) => !prevShowAll)
                    }}
                  >
                    {showAllInCommonAddresses
                      ? `show ${INCOMMON_ADDRESSES_LIMIT}`
                      : `show all ${inCommonAddressesTotal}`}
                  </ButtonLink>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default AddressProfile
