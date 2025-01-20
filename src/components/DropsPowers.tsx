import { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { clsx } from 'clsx'
import { DropPower as Power } from 'models/drop'
import { useDrops } from 'stores/drops'
import DropPower from 'components/DropPower'
import ErrorMessage from 'components/ErrorMessage'
import 'styles/drops-powers.css'

function DropsPowers({
  showAll = false,
  perfectPower,
  selectedDropIds,
  onSelect,
  powers,
  size = 64,
  children,
}: {
  showAll?: boolean
  perfectPower?: number
  selectedDropIds: number[]
  onSelect: (dropId: number) => void
  powers: Power[]
  size?: number
  children?: ReactNode
}) {
  const { loading, error, errors, drops, retryDrops } = useDrops()

  const onDropSelect = (dropId: number) => {
    retryDrops([dropId])
    onSelect(dropId)
  }

  return (
    <>
      {error && (
        <ErrorMessage error={error} />
      )}
      <div className={clsx('drops-powers', showAll && 'show-all')}>
        {powers.map(({ dropId, power }) => (
          <div
            key={dropId}
            className={clsx('drop-power-card', {
              selected: selectedDropIds.includes(dropId),
              perfect: perfectPower === power,
              loading: loading[dropId],
              error: !!errors[dropId],
            })}
            title={
              drops[dropId]?.name ??
              errors[dropId]?.message ??
              (loading[dropId]
                ? `Loading drop #${dropId}`
                : undefined)
            }
          >
            <button
              className="drop-select-button"
              disabled={loading[dropId]}
              onClick={() => onDropSelect(dropId)}
              style={{
                width: `${size}px`,
                height: `${size}px`,
              }}
            >
              <DropPower
                drop={drops[dropId]}
                loading={loading[dropId]}
                error={errors[dropId]}
                perfect={perfectPower === power}
                count={power}
                size={size}
              />
            </button>
            <Link to={`/drop/${dropId}`} className="drop-id">
              #{dropId}
            </Link>
          </div>
        ))}
        {children}
      </div>
    </>
  )
}

export default DropsPowers
