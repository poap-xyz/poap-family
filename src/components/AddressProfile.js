import { useContext, useEffect, useState } from 'react'
import { LazyImage } from 'react-lazy-images'
import { OpenNewWindow } from 'iconoir-react'
import { POAP_SCAN_URL } from '../models/poap'
import { INCOMMON_EVENTS_LIMIT } from '../models/in-common'
import { PROFILE_EVENTS_LIMIT } from '../models/address'
import { ResolverEnsContext, ReverseEnsContext } from '../stores/ethereum'
import { scanAddress } from '../loaders/poap'
import TokenImage from './TokenImage'
import ButtonLink from './ButtonLink'
import ErrorMessage from './ErrorMessage'
import Loading from './Loading'
import '../styles/address-profile.css'

function AddressProfile({
  address,
  events = {},
  inCommonEventIds = [],
}) {
  const { avatars, resolveMeta } = useContext(ResolverEnsContext)
  const { ensNames } = useContext(ReverseEnsContext)
  const [showAllPOAPs, setShowAllPOAPs] = useState(false)
  const [showAllInCommon, setShowAllInCommon] = useState(false)
  const [loading, setLoading] = useState(0)
  const [error, setError] = useState(null)
  const [poaps, setPOAPs] = useState(null)

  const inCommonTotal = inCommonEventIds.length
  const inCommonHasMore = inCommonTotal > INCOMMON_EVENTS_LIMIT

  let inCommonEventIdsVisible = inCommonEventIds.slice()

  if (inCommonHasMore && !showAllInCommon) {
    inCommonEventIdsVisible = inCommonEventIds.slice(0, INCOMMON_EVENTS_LIMIT)
  }

  const poapsTotal = poaps === null ? 0 : poaps.length
  const poapsHasMore = poapsTotal > PROFILE_EVENTS_LIMIT

  let poapsVisible = poaps === null ? [] : poaps.slice()

  if (poapsHasMore && !showAllPOAPs) {
    poapsVisible = poaps.slice(0, PROFILE_EVENTS_LIMIT)
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
        resolveMeta(ensNames[address]).then(
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

  return (
    <div className="address-profile">
      {loading > 0 && (
        <Loading small={true} />
      )}
      {error && (
        <ErrorMessage>
          <p>{error.message}</p>
        </ErrorMessage>
      )}
      {!loading && !error && (
        <>
          {address in ensNames && avatars[ensNames[address]] && avatars[ensNames[address]].startsWith('http') && (
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
                <ErrorMessage>
                  <p>Avatar could not be loaded</p>
                </ErrorMessage>
              )}
            />
          )}
          <a className="profile-address" href={`${POAP_SCAN_URL}/${address}`} title={`Scan ${address in ensNames ? ensNames[address] : address}`} target="_blank" rel="noopener noreferrer">
            <code>{address}</code>
            <OpenNewWindow width={11} height={11} />
          </a>
          {address in ensNames && (
            <big className="profile-ens">{ensNames[address]}</big>
          )}
          {poaps !== null && Array.isArray(poaps) && poaps.length > 0 && (
            <div className={`profile-poaps${showAllPOAPs ? ' show-all' : ''}`}>
              <h4>{poapsTotal} collected drops</h4>
              {poapsVisible.map((token) => (
                token.id && token.event && (
                  <TokenImage key={token.id} event={token.event} size={18} resize={true} />
                )
              ))}
              {poapsHasMore && (
                <div className="show-more">
                  <ButtonLink onClick={() => setShowAllPOAPs((prevShowAll) => !prevShowAll)}>
                    {showAllPOAPs ? `show ${PROFILE_EVENTS_LIMIT}` : `show all ${poapsTotal}`}
                  </ButtonLink>
                </div>
              )}
            </div>
          )}
          {Array.isArray(inCommonEventIds) && inCommonEventIds.length > 0 && (
            <div className={`profile-in-common${showAllInCommon ? ' show-all' : ''}`}>
              <h4>{inCommonTotal} in common drops</h4>
              {inCommonEventIdsVisible.map((eventId) => (
                eventId in events && (
                  <TokenImage key={eventId} event={events[eventId]} size={18} resize={true} />
                )
              ))}
              {inCommonHasMore && (
                <div className="show-more">
                  <ButtonLink onClick={() => setShowAllInCommon((prevShowAll) => !prevShowAll)}>
                    {showAllInCommon ? `show ${INCOMMON_EVENTS_LIMIT}` : `show all ${inCommonTotal}`}
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
