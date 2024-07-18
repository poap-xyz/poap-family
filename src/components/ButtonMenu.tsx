import { ReactNode } from 'react'
import ButtonGroup from 'components/ButtonGroup'
import 'styles/button-menu.css'

function ButtonMenu({
  primary,
  buttons,
}: {
  primary: ReactNode
  buttons: ReactNode
}) {
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
