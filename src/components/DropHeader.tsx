import { Link } from 'react-router-dom'
import { Drop } from 'models/drop'
import Loading from 'components/Loading'
import ErrorMessage from 'components/ErrorMessage'
import TokenImageZoom from 'components/TokenImageZoom'
import 'styles/drop-header.css'

function DropHeader({
  dropId,
  drop,
  loading = false,
  error,
  size = 48,
}: {
  dropId: number
  drop?: Drop
  loading?: boolean
  error?: Error
  size: number
}) {
  return (
    <>
      <div className="drop-header">
        <div
          className="drop-header-image"
          style={{
            width: `${size}px`,
            height: `${size}px`,
          }}
        >
          {drop && (
            <TokenImageZoom drop={drop} zoomSize={512} size={size} />
          )}
          {!drop && loading && (
            <Loading size="medium" />
          )}
        </div>
        <div className="drop-header-details">
          <Link to={`/drop/${dropId}`} className="drop-id">#{dropId}</Link>
          {drop && (
            <h2 title={drop.name}>{drop.name}</h2>
          )}
          {!drop && loading && (
            <h2>{' '}</h2>
          )}
        </div>
      </div>
      {error && (
        <ErrorMessage error={error} />
      )}
    </>
  )
}

export default DropHeader
