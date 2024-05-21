import PropTypes from 'prop-types'
import { useContext, useEffect, useState } from 'react'
import { LazyImage } from 'react-lazy-images'
import { clsx } from 'clsx'
import { formatMonthYear } from 'utils/date'
import { POAP_SCAN_URL, findInitialPOAPDate } from 'models/poap'
import { DropProps } from 'models/drop'
import {
  INCOMMON_ADDRESSES_LIMIT,
  INCOMMON_EVENTS_LIMIT,
} from 'models/in-common'
import { POAP_PROFILE_LIMIT } from 'models/poap'
import { ResolverEnsContext, ReverseEnsContext } from 'stores/ethereum'
import { scanAddress } from 'loaders/poap'
import ExternalLink from 'components/ExternalLink'
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
  events = {},
  inCommonEventIds = [],
  inCommonAddresses = [],
}) {
  const { avatars, resolveMeta } = useContext(ResolverEnsContext)
  const { ensNames } = useContext(ReverseEnsContext)
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
  /**
   * @type {ReturnType<typeof useState<number>>}
   */
  const [loading, setLoading] = useState(0)
  /**
   * @type {ReturnType<typeof useState<Error | null>>}
   */
  const [error, setError] = useState(null)
  /**
   * @type {ReturnType<typeof useState<Awaited<ReturnType<scanAddress>>> | null>}
   */
  const [poaps, setPOAPs] = useState(null)
  /**
   * @type {ReturnType<typeof useState<Date | null>>}
   */
  const [since, setSince] = useState(null)

  const poapsTotal = poaps === null ? 0 : poaps.length
  const poapsHasMore = poapsTotal > POAP_PROFILE_LIMIT

  let poapsVisible = poaps === null ? [] : poaps.slice()
  if (poapsHasMore && !showAllPOAPs) {
    poapsVisible = poaps.slice(0, POAP_PROFILE_LIMIT)
  }

  const inCommonEventsTotal = inCommonEventIds.length
  const inCommonEventsHasMore = inCommonEventsTotal > INCOMMON_EVENTS_LIMIT

  let inCommonEventIdsVisible = inCommonEventIds.slice()
  if (inCommonEventsHasMore && !showAllInCommonEvents) {
    inCommonEventIdsVisible = inCommonEventIds.slice(0, INCOMMON_EVENTS_LIMIT)
  }

  const inCommonAddressesTotal = inCommonAddresses.length
  const inCommonAddressesHasMore = inCommonAddressesTotal > INCOMMON_ADDRESSES_LIMIT

  let inCommonAddressesVisible = inCommonAddresses.slice()
  if (inCommonAddressesHasMore && !showAllInCommonAddresses) {
    inCommonAddressesVisible = inCommonAddresses.slice(0, INCOMMON_ADDRESSES_LIMIT)
  }

  useEffect(
    () => {
      if (
        address in ensNames &&
        (
          !(ensNames[address] in avatars) ||
          avatars[ensNames[address]] === undefined
        ) &&
        !error
      ) {
        setLoading((prevLoading) => prevLoading + 1)
        resolveMeta(ensNames[address], address).then(
          (meta) => {
            setLoading((prevLoading) => prevLoading - 1)
          },
          (err) => {
            setLoading((prevLoading) => prevLoading - 1)
            setError(err)
          }
        )
      }
    },
    [address, avatars, ensNames, resolveMeta, error]
  )

  useEffect(
    () => {
      let controller
      if (
        poaps === null &&
        !error
      ) {
        controller = new AbortController()
        setLoading((prevLoading) => prevLoading + 1)
        scanAddress(address, controller.signal).then(
          (foundPOAPs) => {
            setLoading((prevLoading) => prevLoading - 1)
            setPOAPs(foundPOAPs)
            if (Array.isArray(foundPOAPs) && foundPOAPs.length > 0) {
              setSince(findInitialPOAPDate(foundPOAPs))
            }
          },
          (err) => {
            setLoading((prevLoading) => prevLoading - 1)
            setError(err)
            setPOAPs([])
          }
        )
      }
      return () => {
        if (controller) {
          controller.abort()
        }
      }
    },
    [address, poaps, error]
  )

  const hasAvatarImage = (
    address in ensNames &&
    avatars[ensNames[address]] != null &&
    avatars[ensNames[address]].startsWith('http') &&
    !avatars[ensNames[address]].endsWith('json')
  )

  return (
    <div className="address-profile">
      {loading > 0 && (
        <Loading small={true} />
      )}
      {error && (
        <ErrorMessage error={error} />
      )}
      {!loading && !error && (
        <>
          {hasAvatarImage && (
            <LazyImage
              className="profile-avatar"
              src={avatars[ensNames[address]]}
              alt={`Avatar of ${ensNames[address]}`}
              placeholder={({ imageProps, ref }) => (
                <img ref={ref} {...imageProps} /> // eslint-disable-line jsx-a11y/alt-text
              )}
              actual={({ imageProps }) => (
                <img {...imageProps} /> // eslint-disable-line jsx-a11y/alt-text
              )}
              loading={() => (
                <div className="profile-avatar">
                  <Loading small={true} />
                </div>
              )}
              error={() => (
                <ErrorMessage message="Avatar could not be loaded" />
              )}
            />
          )}
          <ExternalLink
            className="profile-address"
            href={`${POAP_SCAN_URL}/${address}`}
            title={`Scan ${address in ensNames ? ensNames[address] : address}`}
          >
            <code>{address}</code>
          </ExternalLink>
          {address in ensNames && (
            <big className="profile-ens">{ensNames[address]}</big>
          )}
          {poaps !== null && Array.isArray(poaps) && poaps.length > 0 && (
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
              <h4>{inCommonAddressesTotal} in common collectors</h4>
              <AddressesList addresses={inCommonAddressesVisible} />
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
  events: PropTypes.objectOf(PropTypes.shape(DropProps)),
  inCommonEventIds: PropTypes.arrayOf(PropTypes.number),
  inCommonAddresses: PropTypes.arrayOf(PropTypes.string),
}

export default AddressProfile
