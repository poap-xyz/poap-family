import PropTypes from 'prop-types'
import { useState } from 'react'
import 'styles/button-refresh.css'

/**
 * @param {PropTypes.InferProps<ButtonRefresh.propTypes>} props
 */
function ButtonRefresh({
  onRefresh = () => {},
}) {
  /**
   * @type {ReturnType<typeof useState<boolean>>}
   */
  const [refreshing, setRefreshing] = useState(false)

  const refresh = () => {
    setRefreshing(true)
    const ret = onRefresh()
    if (ret instanceof Promise) {
      ret.then(() => {
        setRefreshing(false)
      })
    } else {
      setRefreshing(false)
    }
  }

  return (
    <div className="button-refresh">
      <button
        onClick={() => refresh()}
        disabled={refreshing}
        className={refreshing ? 'active' : 'inactive'}
      >
        <svg width="24px" height="24px" strokeWidth="1.5" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" strokeWidth="1.5" />
          <path d="M16.583 9.667C15.81 8.097 14.043 7 11.988 7 9.388 7 7.25 8.754 7 11" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M14.494 9.722H16.4a.6.6 0 00.6-.6V7.5M7.417 13.667C8.191 15.629 9.957 17 12.012 17c2.6 0 4.736-2.193 4.988-5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9.506 13.622H7.6a.6.6 0 00-.6.6V16.4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  )
}

ButtonRefresh.propTypes = {
  onRefresh: PropTypes.func.isRequired,
}

export default ButtonRefresh
