import { clsx } from 'clsx'
import { POAP_SCAN_URL } from 'models/poap'
import { useEns } from 'stores/ethereum'
import 'styles/address-collector.css'

function AddressCollector({
  address,
  ens,
  bigEns = false,
  short = false,
}: {
  address: string
  ens?: string
  bigEns?: boolean
  short?: boolean
}) {
  const { getEnsName } = useEns()

  const ensName = getEnsName(address)

  return (
    <div className={clsx('address-collector', bigEns ? 'big-ens' : 'big-address')}>
      <div className="collector-address">
        <a href={`${POAP_SCAN_URL}/${address}`}>
          {address && (
            <code
              className="address short"
              style={{ display: short ? 'inline' : 'none' }}
              title={address}
            >
              {address.substring(0, 10)}…{address.substr(-8)}
            </code>
          )}
          {!short && address && (
            <code
              className="address long"
              style={{ display: short ? 'none' : 'inline' }}
            >
              {address}
            </code>
          )}
        </a>
      </div>
      {(ens || ensName) && (
        <div className="collector-ens">
          <span className="ens">{ens ?? ensName}</span>
        </div>
      )}
    </div>
  )
}

export default AddressCollector
