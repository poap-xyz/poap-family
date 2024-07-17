import { ReactNode } from 'react'
import 'styles/warning-message.css'

function WarningMessage({ children }: { children: ReactNode }) {
  return (
    <div className="warning-message">
      <div className="warning-message-content">
        {children}
      </div>
    </div>
  )
}

export default WarningMessage
