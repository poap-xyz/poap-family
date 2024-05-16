import PropTypes from 'prop-types'
import { useContext } from 'react'
import { POAP_SCAN_URL } from '../models/poap'
import { ReverseEnsContext } from '../stores/ethereum'
import '../styles/addresses-list.css'

/**
 * @param {PropTypes.InferProps<AddressesList.propTypes>} props
 */
function AddressesList({
  addresses,
}) {
  const { ensNames } = useContext(ReverseEnsContext)

  return (
    <ol className="addresses-list">
      {addresses.map((address) => (
        <li key={address}>
          <a
            href={`${POAP_SCAN_URL}/${address}`}
            title={`Scan ${address in ensNames ? ensNames[address] : address}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {address in ensNames
              ? <span className="ens">{ensNames[address]}</span>
              : <code>{address}</code>
            }
          </a>
        </li>
      ))}
    </ol>
  )
}

AddressesList.propTypes = {
  addresses: PropTypes.arrayOf(PropTypes.string).isRequired,
}

export default AddressesList
