import { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { clsx } from 'clsx'
import { Drop, DropPower as Power } from 'models/drop'
import TokenImage from 'components/TokenImage'
import DropPower from 'components/DropPower'
import 'styles/drops-powers.css'

function DropsPowers({
  showAll = false,
  perfectPower,
  selectedDropIds,
  onSelect,
  drops,
  powers,
  size = 64,
  children,
}: {
  showAll?: boolean
  perfectPower?: number
  selectedDropIds: number[]
  onSelect: (dropId: number) => void
  drops: Record<number, Drop>
  powers: Power[]
  size?: number
  children?: ReactNode
}) {
  return (
    <div className={clsx('drops-powers', showAll && 'show-all')}>
      {powers.map(({ dropId, power }) => (
        <div
          key={dropId}
          className={clsx('drop-power-card', {
            selected: selectedDropIds.includes(dropId),
            perfect: perfectPower === power,
          })}
          title={drops[dropId].name}
        >
          <button
            className="drop-select-button"
            onClick={() => onSelect(dropId)}
            style={{
              width: `${size}px`,
              height: `${size}px`,
            }}
          >
            {perfectPower === power
              ? <TokenImage drop={drops[dropId]} size={size} />
              : <DropPower
                drop={drops[dropId]}
                count={power}
                size={size}
              />
            }
          </button>
          <Link
            to={`/drop/${dropId}`}
            className="drop-id"
          >
            #{dropId}
          </Link>
        </div>
      ))}
      {children}
    </div>
  )
}

export default DropsPowers
