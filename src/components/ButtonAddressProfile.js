import PropTypes from 'prop-types'
import { useContext, useState } from 'react'
import ReactModal from 'react-modal'
import { ReverseEnsContext } from 'stores/ethereum'
import { DropProps } from 'models/drop'
import Card from 'components/Card'
import ButtonClose from 'components/ButtonClose'
import ButtonLink from 'components/ButtonLink'
import AddressProfile from 'components/AddressProfile'
import 'styles/button-address-profile.css'

/**
 * @param {PropTypes.InferProps<ButtonAddressProfile.propTypes>} props
 */
function ButtonAddressProfile({
  address,
  events,
  inCommonEventIds = [],
  inCommonAddresses = [],
}) {
  const { ensNames } = useContext(ReverseEnsContext)
  /**
   * @type {ReturnType<typeof useState<boolean>>}
   */
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <ButtonLink
        className="button-address-profile"
        title={`Open ${address in ensNames ? ensNames[address] : address} profile`}
        onClick={() => setShowModal((show) => !show)}
      >
        {address in ensNames
          ? <span className="ens">{ensNames[address]}</span>
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
              inCommonAddresses={inCommonAddresses}
            />
          </Card>
        </div>
      </ReactModal>
    </>
  )
}

ButtonAddressProfile.propTypes = {
  address: PropTypes.string.isRequired,
  events: PropTypes.objectOf(
    PropTypes.shape(DropProps).isRequired
  ).isRequired,
  inCommonEventIds: PropTypes.arrayOf(PropTypes.number.isRequired),
  inCommonAddresses: PropTypes.arrayOf(PropTypes.string.isRequired),
}

export default ButtonAddressProfile
