import '../styles/button-group.css'

function ButtonGroup({ children, right = false }) {
  return (
    <div className={`button-group${right ? ' right' : ''}`}>
      {children}
    </div>
  )
}

export default ButtonGroup
