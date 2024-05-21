import PropTypes from 'prop-types'
import ReactModal from 'react-modal'
import 'styles/modal.css'

/**
 * @param {PropTypes.InferProps<Modal.propTypes>} props
 */
function Modal({ show, onClose, children, title }) {
  return (
    <ReactModal
      isOpen={show}
      onRequestClose={() => onClose()}
      shouldCloseOnEsc={true}
      shouldCloseOnOverlayClick={true}
      contentLabel={title}
      className="modal"
      overlayClassName="overlay"
    >
      {children}
    </ReactModal>
  )
}

Modal.propTypes = {
  show: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
  title: PropTypes.string,
}

export default Modal
