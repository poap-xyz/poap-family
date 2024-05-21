import PropTypes from 'prop-types'
import { useContext, useState } from 'react'
import { ReverseEnsContext } from 'stores/ethereum'
import { DropProps } from 'models/drop'
import Modal from 'components/Modal'
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
      <Modal
        show={showModal}
        onClose={() => setShowModal(false)}
        title={address in ensNames ? ensNames[address] : address}
      >
        <div className="button-address-profile-modal">
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
      </Modal>
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
