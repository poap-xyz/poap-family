import { Drop } from 'models/drop'
import TokenImage from 'components/TokenImage'
import LinkToScan from 'components/LinkToScan'
import ButtonAddressProfile from 'components/ButtonAddressProfile'
import 'styles/address-collector-line.css'

function AddressCollectorLine({
  ens,
  address,
  drops,
  dropIds,
  collectorsDropIds = [],
  inCommonDropIds = [],
  inCommonAddresses = [],
  linkToScan = false,
}: {
  ens?: string
  address: string
  drops: Record<number, Drop>
  dropIds?: number[]
  collectorsDropIds?: number[]
  inCommonDropIds?: number[]
  inCommonAddresses?: string[]
  linkToScan?: boolean
}) {
  const hasDrops = (
    drops != null &&
    typeof drops === 'object' &&
    dropIds != null &&
    Array.isArray(dropIds) &&
    dropIds.length > 0
  )

  return (
    <div className="address-collector-line">
      <div className="collector-name">
        <ButtonAddressProfile
          address={address}
          drops={drops}
          inCommonEventIds={inCommonDropIds}
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
      {hasDrops && (
        <div className="collector-drops">
          {dropIds.map(
            (dropId) =>
              dropId in drops &&
              collectorsDropIds != null &&
              collectorsDropIds.includes(dropId)
                ? (
                    <TokenImage
                      key={dropId}
                      drop={drops[dropId]}
                      size={18}
                      resize={true}
                    />
                  )
                : (
                    <div
                      key={dropId}
                      className="collector-drop-empty"
                    >
                      {' '}
                    </div>
                  )
          )}
        </div>
      )}
    </div>
  )
}

export default AddressCollectorLine
