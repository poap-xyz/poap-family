import { clsx } from 'clsx'
import '../styles/shadow-text.css'

function ShadowText({ children, grow = false, medium = false, small = false }) {
  return (
    <div className="shadow-text">
      <div
        className={clsx('shadow-text-content', {
          grow,
          medium,
          small,
        })}
      >
        <span className="shadow" aria-hidden="true">{children}</span>
        <span className="text">{children}</span>
      </div>
    </div>
  )
}

export default ShadowText
