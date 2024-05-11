import '../styles/status.css'

function Status({ loading, caching, error }) {
  return (
    <div
      className={`status${loading ? ' status-loading' : ''}${caching ? ' status-caching' : ''}${error ? ' status-error' : ''}`}
    >
      {loading && 'Loading'}
      {caching && 'Caching'}
      {error && 'Error'}
    </div>
  )
}

export default Status
