import { useContext, useState } from 'react'
import { ReverseEnsContext } from 'stores/ethereum'
import { Drop } from 'models/drop'
import Modal from 'components/Modal'
import Card from 'components/Card'
import ButtonClose from 'components/ButtonClose'
import ButtonLink from 'components/ButtonLink'
import AddressProfile from 'components/AddressProfile'
import 'styles/button-address-profile.css'

function ButtonAddressProfile({
  ens,
  address,
  events,
  inCommonEventIds = [],
  inCommonAddresses = [],
  showEns = true,
}: {
  ens?: string
  address: string
  events: Record<number, Drop>
  inCommonEventIds?: number[]
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
              events={events}
              inCommonEventIds={inCommonEventIds}
              inCommonAddresses={inCommonAddresses}
            />
          </Card>
        </div>
      </Modal>
    </>
  )
}

export default ButtonAddressProfile
