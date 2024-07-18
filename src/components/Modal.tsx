import { ReactNode } from 'react'
import ReactModal from 'react-modal'
import 'styles/modal.css'

function Modal({
  show,
  onClose,
  children,
  title,
}: {
  show: boolean
  onClose: () => void
  children: ReactNode
  title?: string
}) {
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

export default Modal
