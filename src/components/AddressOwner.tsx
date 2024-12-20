import { Drop } from 'models/drop'
import TokenImage from 'components/TokenImage'
import LinkToScan from 'components/LinkToScan'
import ButtonAddressProfile from 'components/ButtonAddressProfile'
import 'styles/address-owner.css'

function AddressOwner({
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
    <div className="address-owner">
      <div className="owner-name">
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
          className="owner-scan"
          stamp={true}
          showEns={true}
          ens={ens}
        />
      )}
      {hasDrops && (
        <div className="owner-events">
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
                : <div key={dropId} className="owner-event-empty">{' '}</div>
          )}
        </div>
      )}
    </div>
  )
}

export default AddressOwner
