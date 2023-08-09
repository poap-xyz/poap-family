import ButtonGroup from './ButtonGroup'
import '../styles/button-menu.css'

function ButtonMenu({ primary, buttons }) {
  return (
    <div className="button-menu">
      <div className="button-menu-primary">{primary}</div>
      <div className="button-menu-content">
        <ButtonGroup vertical={true}>
          {buttons}
        </ButtonGroup>
      </div>
    </div>
  )
}

export default ButtonMenu
