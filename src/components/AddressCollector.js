import { useContext } from 'react'
import { ReverseEnsContext } from '../stores/ethereum'
import '../styles/collector.css'

function AddressCollector({ address, ens, bigEns = false, short = false, linkToScan = true }) {
  const { ensNames } = useContext(ReverseEnsContext)

  return (
    <div className={`collector ${bigEns ? 'big-ens' : 'big-address'}`}>
      <div className="collector-address">
        {linkToScan
          ? (
            <a href={`https://app.poap.xyz/scan/${address}`}>
              {address && (
                <code className="address short" style={{ display: short ? 'inline' : 'none' }} title={address}>
                  {address.substring(0, 10)}…{address.substr(-8)}
                </code>
              )}
              {!short && address && (
                <code className="address long" style={{ display: short ? 'none' : 'inline' }}>{address}</code>
              )}
            </a>
          )
          : (
            <>
              {address && (
                <code className="address short" style={{ display: short ? 'inline' : 'none' }} title={address}>
                  {address.substring(0, 10)}…{address.substr(-8)}
                </code>
              )}
              {!short && address && (
                <code className="address long" style={{ display: short ? 'none' : 'inline' }}>{address}</code>
              )}
            </>
          )
        }
      </div>
      {(ens || (address && ensNames[address])) && (
        <div className="collector-ens">
          <span className="ens">{ens ?? ensNames[address]}</span>
        </div>
      )}
    </div>
  )
}

export default AddressCollector
