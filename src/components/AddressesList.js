import { useContext } from 'react'
import { POAP_SCAN_URL } from '../models/poap'
import { ReverseEnsContext } from '../stores/ethereum'
import '../styles/addresses-list.css'

function AddressesList({
  addresses = [],
}) {
  const { ensNames } = useContext(ReverseEnsContext)

  return (
    <ol className="addresses-list">
      {addresses.map((address) => (
        <li key={address}>
          <a href={`${POAP_SCAN_URL}/${address}`} title={`Scan ${address in ensNames ? ensNames[address] : address}`} target="_blank" rel="noopener noreferrer">
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

export default AddressesList
