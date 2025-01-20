import { Fragment } from 'react'
import { useDrops } from 'stores/drops'
import Loading from 'components/Loading'
import ErrorMessage from 'components/ErrorMessage'
import TokenImage from 'components/TokenImage'
import LinkToScan from 'components/LinkToScan'
import ButtonAddressProfile from 'components/ButtonAddressProfile'
import 'styles/address-collector-line.css'

function AddressCollectorLine({
  ens,
  address,
  dropIds,
  collectorsDropIds = [],
  inCommonDropIds = [],
  inCommonAddresses = [],
  linkToScan = false,
}: {
  ens?: string
  address: string
  dropIds?: number[]
  collectorsDropIds?: number[]
  inCommonDropIds?: number[]
  inCommonAddresses?: string[]
  linkToScan?: boolean
}) {
  const {
    drops,
    loading,
    error,
    errors,
  } = useDrops()

  return (
    <div className="address-collector-line">
      <div className="collector-name">
        <ButtonAddressProfile
          address={address}
          inCommonDropIds={inCommonDropIds}
          inCommonAddresses={inCommonAddresses}
          showEns={true}
          ens={ens}
        />
      </div>
      {linkToScan && (
        <LinkToScan
          address={address}
          className="collector-scan"
          stamp={true}
          showEns={true}
          ens={ens}
        />
      )}
      {dropIds != null && (
        <>
          {error && (
            <ErrorMessage error={error} />
          )}
          <div className="collector-drops">
            {dropIds.map((dropId) => (
              collectorsDropIds != null &&
              collectorsDropIds.includes(dropId)
                ? (
                    <Fragment key={dropId}>
                      {!drops[dropId] && loading[dropId] && (
                        <Loading size="small" />
                      )}
                      {!drops[dropId] && !loading[dropId] && errors[dropId] && (
                        <ErrorMessage error={errors[dropId]} />
                      )}
                      {drops[dropId] && (
                        <TokenImage
                          drop={drops[dropId]}
                          size={18}
                          resize={true}
                        />
                      )}
                    </Fragment>
                  )
                : (
                    <div
                      key={dropId}
                      className="collector-drop-empty"
                    >
                      {' '}
                    </div>
                  )
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default AddressCollectorLine
