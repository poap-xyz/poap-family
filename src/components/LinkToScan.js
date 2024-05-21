import PropTypes from 'prop-types'
import { useContext } from 'react'
import { clsx } from 'clsx'
import { ReverseEnsContext } from 'stores/ethereum'
import { POAP_SCAN_URL } from 'models/poap'
import POAP_Stamp from 'images/POAP_Stamp.svg'
import 'styles/link-to-scan.css'

/**
 * @param {PropTypes.InferProps<LinkToScan.propTypes>} props
 */
function LinkToScan({
  className,
  address,
  title,
  stamp = false,
}) {
  const { ensNames } = useContext(ReverseEnsContext)

  return (
    <a
      className={clsx('link-to-scan', className)}
      href={`${POAP_SCAN_URL}/${address}`}
      title={title ??
        `Scan ${address in ensNames ? ensNames[address] : address}`}
      target="_blank"
      rel="noopener noreferrer"
    >
      {stamp
        ? (
            <img
              src={POAP_Stamp}
              alt={title ??
                `Scan ${address in ensNames ? ensNames[address] : address}`}
            />
          )
        : (
            address in ensNames
              ? <span className="ens">{ensNames[address]}</span>
              : <code>{address}</code>
          )
      }
    </a>
  )
}

LinkToScan.propTypes = {
  className: PropTypes.string,
  address: PropTypes.string.isRequired,
  title: PropTypes.string,
  stamp: PropTypes.bool,
}

export default LinkToScan
