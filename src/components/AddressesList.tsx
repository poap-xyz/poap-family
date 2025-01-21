import { Link } from 'react-router-dom'
import { useEns } from 'stores/ethereum'
import LinkToScan from 'components/LinkToScan'
import 'styles/addresses-list.css'

function AddressesList({
  addresses,
  addressToCompare,
}: {
  addresses: string[]
  addressToCompare?: string
}) {
  const { getEnsName } = useEns()

  return (
    <ol className="addresses-list">
      {addresses.map((address) => (
        <li key={address}>
          {addressToCompare
            ? (
              <Link to={`/addresses#${addressToCompare},${address}`}>
                {getEnsName(address)
                  ? <span className="ens">{getEnsName(address)}</span>
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

export default AddressesList
