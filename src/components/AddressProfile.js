import PropTypes from 'prop-types'
import { useContext, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { clsx } from 'clsx'
import { formatMonthYear } from 'utils/date'
import { findInitialPOAPDate } from 'models/poap'
import { DropProps } from 'models/drop'
import {
  INCOMMON_ADDRESSES_LIMIT,
  INCOMMON_EVENTS_LIMIT,
} from 'models/in-common'
import { POAP_PROFILE_LIMIT } from 'models/poap'
import { ReverseEnsContext } from 'stores/ethereum'
import useAddressTokens from 'hooks/useAddressTokens'
import EnsAvatar from 'components/EnsAvatar'
import LinkToScan from 'components/LinkToScan'
import AddressesList from 'components/AddressesList'
import TokenImage from 'components/TokenImage'
import ButtonLink from 'components/ButtonLink'
import ErrorMessage from 'components/ErrorMessage'
import Loading from 'components/Loading'
import 'styles/address-profile.css'

/**
 * @param {PropTypes.InferProps<AddressProfile.propTypes>} props
 */
function AddressProfile({
  address,
  events,
  inCommonEventIds = [],
  inCommonAddresses = [],
}) {
  const { getEnsName } = useContext(ReverseEnsContext)
  /**
   * @type {ReturnType<typeof useState<boolean>>}
   */
  const [showAllPOAPs, setShowAllPOAPs] = useState(false)
  /**
   * @type {ReturnType<typeof useState<boolean>>}
   */
  const [showAllInCommonEvents, setShowAllInCommonEvents] = useState(false)
  /**
   * @type {ReturnType<typeof useState<boolean>>}
   */
  const [showAllInCommonAddresses, setShowAllInCommonAddresses] = useState(false)

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

  const inCommonEventsTotal = inCommonEventIds == null ? 0 : inCommonEventIds.length
  const inCommonEventsHasMore = inCommonEventsTotal > INCOMMON_EVENTS_LIMIT

  let inCommonEventIdsVisible = inCommonEventIds == null ? [] : inCommonEventIds.slice()
  if (inCommonEventsHasMore && !showAllInCommonEvents) {
    inCommonEventIdsVisible = inCommonEventIdsVisible.slice(0, INCOMMON_EVENTS_LIMIT)
  }

  const inCommonAddressesTotal = inCommonAddresses == null ? 0 : inCommonAddresses.length
  const inCommonAddressesHasMore = inCommonAddressesTotal > INCOMMON_ADDRESSES_LIMIT

  let inCommonAddressesVisible = inCommonAddresses == null ? [] : inCommonAddresses.slice()
  if (inCommonAddressesHasMore && !showAllInCommonAddresses) {
    inCommonAddressesVisible = inCommonAddressesVisible.slice(0, INCOMMON_ADDRESSES_LIMIT)
  }

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

  const ensName = getEnsName(address)

  return (
    <div className="address-profile">
      {loadingAddressTokens && (
        <Loading small={true} />
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
                token.id && token.event && (
                  <TokenImage
                    key={token.id}
                    event={token.event}
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
          {Array.isArray(inCommonEventIds) && inCommonEventIds.length > 0 && (
            <div
              className={clsx('profile-in-common',
                showAllInCommonEvents && 'show-all',
              )}
            >
              <h4>{inCommonEventsTotal} in common drops</h4>
              {inCommonEventIdsVisible.map((eventId) => (
                eventId in events && (
                  <TokenImage
                    key={eventId}
                    event={events[eventId]}
                    size={18}
                    resize={true}
                  />
                )
              ))}
              {inCommonEventsHasMore && (
                <div className="show-more">
                  <ButtonLink
                    onClick={() => {
                      setShowAllInCommonEvents((prevShowAll) => !prevShowAll)
                    }}
                  >
                    {showAllInCommonEvents
                      ? `show ${INCOMMON_EVENTS_LIMIT}`
                      : `show all ${inCommonEventsTotal}`}
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

AddressProfile.propTypes = {
  address: PropTypes.string.isRequired,
  events: PropTypes.objectOf(
    PropTypes.shape(DropProps).isRequired
  ).isRequired,
  inCommonEventIds: PropTypes.arrayOf(PropTypes.number.isRequired),
  inCommonAddresses: PropTypes.arrayOf(PropTypes.string.isRequired),
}

export default AddressProfile
