import { clsx } from 'clsx'
import '../styles/button-group.css'

function ButtonGroup({ children, right = false, vertical = false }) {
  return (
    <div
      className={clsx('button-group', {
        right,
        vertical,
      })}
    >
      {children}
    </div>
  )
}

export default ButtonGroup
