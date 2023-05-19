import { useContext, useEffect, useState } from 'react'
import { LazyImage } from 'react-lazy-images'
import { OpenNewWindow } from 'iconoir-react'
import { POAP_SCAN_URL } from '../models/poap'
import { ResolverEnsContext, ReverseEnsContext } from '../stores/ethereum'
import { scanAddress } from '../loaders/poap'
import ErrorMessage from './ErrorMessage'
import Loading from './Loading'
import '../styles/address-profile.css'

function AddressProfile({
  address,
  events = {},
  showInCommon = true,
}) {
  const { avatars, resolveMeta } = useContext(ResolverEnsContext)
  const { ensNames } = useContext(ReverseEnsContext)
  const [loading, setLoading] = useState(0)
  const [error, setError] = useState(null)
  const [poaps, setPOAPs] = useState(null)

  useEffect(
    () => {
      if (
        address in ensNames &&
        avatars[ensNames[address]] === undefined &&
        !error
      ) {
        setLoading((prevLoading) => prevLoading++)
        resolveMeta(ensNames[address]).then(
          (meta) => {
            setLoading((prevLoading) => prevLoading--)
          },
          (err) => {
            setLoading((prevLoading) => prevLoading--)
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
        setLoading((prevLoading) => prevLoading++)
        scanAddress(address, controller.signal).then(
          (foundPOAPs) => {
            setLoading((prevLoading) => prevLoading--)
            setPOAPs(foundPOAPs)
          },
          (err) => {
            setLoading((prevLoading) => prevLoading--)
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
          <a className="profile-address" href={`${POAP_SCAN_URL}/${address}`} target="_blank" rel="noopener noreferrer">
            <code>{address}</code>
            <OpenNewWindow width={11} height={11} />
          </a>
          {address in ensNames && (
            <big className="profile-ens">{ensNames[address]}</big>
          )}
        </>
      )}
    </div>
  )
}

export default AddressProfile
