import { useContext } from 'react'
import { clsx } from 'clsx'
import { ReverseEnsContext } from 'stores/ethereum'
import { POAP_SCAN_URL } from 'models/poap'
import POAP_Stamp from 'assets/images/POAP_Stamp.svg'
import 'styles/link-to-scan.css'

function LinkToScan({
  className,
  ens,
  address,
  title,
  stamp = false,
  showEns = true,
}: {
  className?: string
  ens?: string
  address: string
  title?: string
  stamp?: boolean
  showEns?: boolean
}) {
  const { getEnsName } = useContext(ReverseEnsContext)

  const ensName = ens ?? getEnsName(address)

  return (
    <a
      className={clsx('link-to-scan', className)}
      href={`${POAP_SCAN_URL}/${address}`}
      title={title ??
        `Scan ${ensName ?? address}`}
      target="_blank"
      rel="noopener noreferrer"
    >
      {stamp
        ? (
            <img
              src={POAP_Stamp}
              alt={title ??
                `Scan ${ensName ?? address}`}
            />
          )
        : (
            showEns && ensName
              ? <span className="ens">{ensName}</span>
              : <code>{address}</code>
          )
      }
    </a>
  )
}

export default LinkToScan
