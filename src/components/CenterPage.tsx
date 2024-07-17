import { ReactNode } from 'react'
import 'styles/center-page.css'

function CenterPage({ children }: { children: ReactNode }) {
  return (
    <div className="center-page">
      {children}
    </div>
  )
}

export default CenterPage
