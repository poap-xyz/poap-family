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

function TokenImageZoom({ drop, size = 128, zoomSize = 512 }: {
  drop: Drop | CachedEvent
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
        <TokenImage drop={drop} size={size} resize={true} />
      </button>
      <Modal
        show={showModal}
        onClose={() => setShowModal(false)}
        title={drop.name}
      >
        <LazyImage
          src={drop.image_url}
          alt={drop.name}
          placeholder={({ imageProps, ref }) => (
            <div className="token-image-zoom-modal token-image-zoom-placeholder" ref={ref}>
              <Card>
                <ButtonClose onClose={() => setShowModal(false)} />
                <button
                  onClick={() => setShowModal((show) => !show)}
                  className="token-image-zoom-out-button"
                >
                  <TokenImage
                    drop={drop}
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
                    drop={drop}
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
                    drop={drop}
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
