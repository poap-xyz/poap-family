import PropTypes from 'prop-types'
import { useContext } from 'react'
import { Link } from 'react-router-dom'
import { ReverseEnsContext } from 'stores/ethereum'
import LinkToScan from 'components/LinkToScan'
import 'styles/addresses-list.css'

/**
 * @param {PropTypes.InferProps<AddressesList.propTypes>} props
 */
function AddressesList({
  addresses,
  addressToCompare,
}) {
  const { ensNames } = useContext(ReverseEnsContext)

  return (
    <ol className="addresses-list">
      {addresses.map((address) => (
        <li key={address}>
          {addressToCompare
            ? (
              <Link to={`/addresses#${addressToCompare},${address}`}>
                {address in ensNames
                  ? <span className="ens">{ensNames[address]}</span>
                  : <code>{address}</code>}
              </Link>
            )
            : <LinkToScan address={address} />
          }
        </li>
      ))}
    </ol>
  )
}

AddressesList.propTypes = {
  addresses: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
  addressToCompare: PropTypes.string,
}

export default AddressesList
