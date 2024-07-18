import { clsx } from 'clsx'
import 'styles/status.css'

function Status({
  loading,
  caching,
  error,
}: {
  loading?: boolean
  caching?: boolean
  error?: boolean
}) {
  if (!loading && !caching && !error) {
    return null
  }
  return (
    <div
      className={clsx('status',
        loading && 'status-loading',
        caching && 'status-caching',
        error && 'status-error',
      )}
    >
      {loading && 'Loading'}
      {caching && 'Caching'}
      {error && 'Error'}
    </div>
  )
}

export default Status
