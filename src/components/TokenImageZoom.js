import PropTypes from 'prop-types'
import { useState } from 'react'
import { LazyImage } from 'react-lazy-images'
import ReactModal from 'react-modal'
import { DropProps } from 'models/drop'
import Card from 'components/Card'
import ErrorMessage from 'components/ErrorMessage'
import TokenImage from 'components/TokenImage'
import ButtonClose from 'components/ButtonClose'
import Loading from 'components/Loading'
import 'styles/token-image-zoom.css'

/**
 * @param {PropTypes.InferProps<TokenImageZoom.propTypes>} props
 */
function TokenImageZoom({ event, size = 128, zoomSize = 512 }) {
  /**
   * @type {ReturnType<typeof useState<boolean>>}
   */
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
                    imgSize={zoomSize}
                    resize={true}
                    original={true}
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
                    original={true}
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
                    imgSize={zoomSize}
                    resize={true}
                    original={true}
                  />
                </button>
              </Card>
            </div>
          )}
          error={() => (
            <div className="token-image-zoom-container token-image-zoom-error">
              <Card>
                <ButtonClose onClose={() => setShowModal(false)} />
                <ErrorMessage message="Artwork could not be loaded" />
              </Card>
            </div>
          )}
        />
      </ReactModal>
    </div>
  )
}

TokenImageZoom.propTypes = {
  event: PropTypes.shape(DropProps).isRequired,
  size: PropTypes.number,
  zoomSize: PropTypes.number,
}

export default TokenImageZoom
