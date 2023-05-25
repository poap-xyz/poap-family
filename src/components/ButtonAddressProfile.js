import { useContext, useState } from 'react'
import ReactModal from 'react-modal'
import { ReverseEnsContext } from '../stores/ethereum'
import Card from './Card'
import ButtonClose from './ButtonClose'
import ButtonLink from './ButtonLink'
import AddressProfile from './AddressProfile'
import '../styles/button-address-profile.css'

function ButtonAddressProfile({
  address,
  events = {},
  inCommonEventIds = [],
}) {
  const { ensNames } = useContext(ReverseEnsContext)
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <ButtonLink
        className="button-address-profile"
        onClick={() => setShowModal((show) => !show)}
      >
        {address in ensNames
          ? <span className="ens" title={address}>{ensNames[address]}</span>
          : <code>{address}</code>
        }
      </ButtonLink>
      <ReactModal
        isOpen={showModal}
        onRequestClose={() => setShowModal(false)}
        shouldCloseOnEsc={true}
        shouldCloseOnOverlayClick={true}
        contentLabel={address in ensNames ? ensNames[address] : address}
        className="button-address-profile-modal"
      >
        <div className="button-address-profile-container">
          <Card>
            <ButtonClose onClose={() => setShowModal(false)} />
            <AddressProfile
              address={address}
              events={events}
              inCommonEventIds={inCommonEventIds}
            />
          </Card>
        </div>
      </ReactModal>
    </>
  )
}

export default ButtonAddressProfile
