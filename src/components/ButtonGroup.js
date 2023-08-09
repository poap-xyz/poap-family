import '../styles/button-group.css'

function ButtonGroup({ children, right = false, vertical = false }) {
  return (
    <div className={`button-group${right ? ' right' : ''}${vertical ? ' vertical' : ''}`}>
      {children}
    </div>
  )
}

export default ButtonGroup
