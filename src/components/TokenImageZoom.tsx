import { useState } from 'react'
import { LazyImage } from 'react-lazy-images'
import { Drop } from 'models/drop'
import { CachedEvent } from 'models/api'
import Modal from 'components/Modal'
import Card from 'components/Card'
import ErrorMessage from 'components/ErrorMessage'
import TokenImage from 'components/TokenImage'
import ButtonClose from 'components/ButtonClose'
import Loading from 'components/Loading'
import 'styles/token-image-zoom.css'

function TokenImageZoom({ event, size = 128, zoomSize = 512 }: {
  event: Drop | CachedEvent
  size?: number
  zoomSize?: number
}) {
  const [showModal, setShowModal] = useState<boolean>(false)

  return (
    <div className="token-image-zoom">
      <button
        onClick={() => setShowModal((show) => !show)}
        className="token-image-zoom-in-button"
      >
        <TokenImage event={event} size={size} resize={true} />
      </button>
      <Modal
        show={showModal}
        onClose={() => setShowModal(false)}
        title={event.name}
      >
        <LazyImage
          src={event.image_url}
          alt={event.name}
          placeholder={({ imageProps, ref }) => (
            <div className="token-image-zoom-modal token-image-zoom-placeholder" ref={ref}>
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
            <div className="token-image-zoom-modal token-image-zoom-actual">
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
            <div className="token-image-zoom-modal token-image-zoom-loading">
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
            <div className="token-image-zoom-modal token-image-zoom-error">
              <Card>
                <ButtonClose onClose={() => setShowModal(false)} />
                <ErrorMessage message="Artwork could not be loaded" />
              </Card>
            </div>
          )}
        />
      </Modal>
    </div>
  )
}

export default TokenImageZoom
