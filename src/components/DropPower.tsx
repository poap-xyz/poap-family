import { clsx } from 'clsx'
import { Drop } from 'models/drop'
import TokenImage from 'components/TokenImage'
import Loading from 'components/Loading'
import 'styles/drop-power.css'

function DropPower({
  drop,
  loading = false,
  error,
  perfect,
  count,
  size = 64,
}: {
  drop?: Drop
  loading?: boolean
  error?: Error
  perfect: boolean
  count: number
  size?: number
}) {


  return (
    <div
      className={clsx('drop-power', {
        perfect,
        loading: !drop && loading,
        error: !drop && !!error,
      })}
      style={{
        width: `${size}px`,
        height: `${size}px`,
      }}
    >
      {drop && (
        <TokenImage drop={drop} size={size} />
      )}
      {!drop && loading && (
        <Loading size="medium" />
      )}
      {!perfect && (
        <span className="drop-power-value">{count}</span>
      )}
    </div>
  )
}

export default DropPower
