import { Cancel } from 'iconoir-react'
import '../styles/button-close.css'

function ButtonClose({ onClose = () => {} }) {
  return (
    <button className="button-close" onClick={() => onClose()}>
      <Cancel />
    </button>
  )
}

export default ButtonClose
