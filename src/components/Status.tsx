import { clsx } from 'clsx'
import 'styles/status.css'

function Status({
  loading,
  error,
}: {
  loading?: boolean
  error?: boolean
}) {
  if (!loading && !error) {
    return null
  }
  return (
    <div
      className={clsx('status',
        loading && 'status-loading',
        error && 'status-error',
      )}
    >
      {loading && 'Loading'}
      {error && 'Error'}
    </div>
  )
}

export default Status
