import PropTypes from 'prop-types'
import { useContext } from 'react'
import { clsx } from 'clsx'
import { POAP_SCAN_URL } from 'models/poap'
import { ReverseEnsContext } from 'stores/ethereum'
import 'styles/collector.css'

/**
 * @param {PropTypes.InferProps<AddressCollector.propTypes>} props
 */
function AddressCollector({
  address,
  ens,
  bigEns = false,
  short = false,
}) {
  const { ensNames } = useContext(ReverseEnsContext)

  return (
    <div className={clsx('collector', bigEns ? 'big-ens' : 'big-address')}>
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
      {(ens || (address && ensNames[address])) && (
        <div className="collector-ens">
          <span className="ens">{ens ?? ensNames[address]}</span>
        </div>
      )}
    </div>
  )
}

AddressCollector.propTypes = {
  address: PropTypes.string.isRequired,
  ens: PropTypes.string,
  bigEns: PropTypes.bool,
  short: PropTypes.bool,
}

export default AddressCollector
