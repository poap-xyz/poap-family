import { useContext, useState } from 'react'
import { ReverseEnsContext } from 'stores/ethereum'
import Modal from 'components/Modal'
import Card from 'components/Card'
import ButtonClose from 'components/ButtonClose'
import ButtonLink from 'components/ButtonLink'
import AddressProfile from 'components/AddressProfile'
import 'styles/button-address-profile.css'

function ButtonAddressProfile({
  ens,
  address,
  inCommonDropIds = [],
  inCommonAddresses = [],
  showEns = true,
}: {
  ens?: string
  address: string
  inCommonDropIds?: number[]
  inCommonAddresses?: string[]
  showEns?: boolean
}) {
  const { getEnsName } = useContext(ReverseEnsContext)

  const [showModal, setShowModal] = useState<boolean>(false)

  const ensName = ens ?? getEnsName(address)

  return (
    <>
      <ButtonLink
        className="button-address-profile"
        title={`Open ${ensName ?? address} profile`}
        onClick={() => setShowModal((show) => !show)}
      >
        {showEns && ensName
          ? <span className="ens">{ensName}</span>
          : <code>{address}</code>
        }
      </ButtonLink>
      <Modal
        show={showModal}
        onClose={() => setShowModal(false)}
        title={ensName ?? address}
      >
        <div className="button-address-profile-modal">
          <Card>
            <ButtonClose onClose={() => setShowModal(false)} />
            <AddressProfile
              ens={ens}
              address={address}
              inCommonDropIds={inCommonDropIds}
              inCommonAddresses={inCommonAddresses}
            />
          </Card>
        </div>
      </Modal>
    </>
  )
}

export default ButtonAddressProfile
