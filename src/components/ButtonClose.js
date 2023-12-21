import { Xmark } from 'iconoir-react'
import '../styles/button-close.css'

function ButtonClose({ onClose = () => {} }) {
  return (
    <button className="button-close" onClick={() => onClose()}>
      <Xmark />
    </button>
  )
}

export default ButtonClose
