import { useState } from 'react'
import { LazyImage } from 'react-lazy-images'
import ReactModal from 'react-modal'
import Card from './Card'
import ErrorMessage from './ErrorMessage'
import TokenImage from './TokenImage'
import ButtonClose from './ButtonClose'
import Loading from './Loading'
import '../styles/token-image-zoom.css'

function TokenImageZoom({ event, size = 128, zoomSize = 512 }) {
  const [showModal, setShowModal] = useState(false)

  return (
    <div className="token-image-zoom">
      <button
        onClick={() => setShowModal((show) => !show)}
        className="token-image-zoom-in-button"
      >
        <TokenImage event={event} size={size} resize={true} />
      </button>
      <ReactModal
        isOpen={showModal}
        onRequestClose={() => setShowModal(false)}
        shouldCloseOnEsc={true}
        shouldCloseOnOverlayClick={true}
        contentLabel={event.name}
        className="token-image-zoom-modal"
      >
        <LazyImage
          src={event.image_url}
          alt={event.name}
          placeholder={({ imageProps, ref }) => (
            <div className="token-image-zoom-container token-image-zoom-placeholder" ref={ref}>
              <Card>
                <ButtonClose onClose={() => setShowModal(false)} />
                <button
                  onClick={() => setShowModal((show) => !show)}
                  className="token-image-zoom-out-button"
                >
                  <TokenImage
                    event={event}
                    size={size}
                    resize={true}
                    style={{ width: `${zoomSize}px`, height: `${zoomSize}px` }}
                  />
                </button>
              </Card>
            </div>
          )}
          actual={({ imageProps }) => (
            <div className="token-image-zoom-container token-image-zoom-actual">
              <Card>
                <ButtonClose onClose={() => setShowModal(false)} />
                <button
                  onClick={() => setShowModal((show) => !show)}
                  className="token-image-zoom-out-button"
                >
                  <TokenImage
                    event={event}
                    size={zoomSize}
                    resize={false}
                  />
                </button>
              </Card>
            </div>
          )}
          loading={() => (
            <div className="token-image-zoom-container token-image-zoom-loading">
              <Card>
                <ButtonClose onClose={() => setShowModal(false)} />
                <Loading small={true} />
                <button
                  onClick={() => setShowModal((show) => !show)}
                  className="token-image-zoom-out-button"
                >
                  <TokenImage
                    event={event}
                    size={size}
                    resize={true}
                    style={{ width: `${zoomSize}px`, height: `${zoomSize}px` }}
                  />
                </button>
              </Card>
            </div>
          )}
          error={() => (
            <div className="token-image-zoom-container token-image-zoom-error">
              <Card>
                <ButtonClose onClose={() => setShowModal(false)} />
                <ErrorMessage>
                  <p>Artwork could not be loaded</p>
                </ErrorMessage>
              </Card>
            </div>
          )}
        />
      </ReactModal>
    </div>
  )
}

export default TokenImageZoom
