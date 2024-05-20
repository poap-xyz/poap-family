import PropTypes from 'prop-types'
import ButtonGroup from 'components/ButtonGroup'
import 'styles/button-menu.css'

/**
 * @param {PropTypes.InferProps<ButtonMenu.propTypes>} props
 */
function ButtonMenu({
  primary,
  buttons,
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

ButtonMenu.propTypes = {
  primary: PropTypes.node.isRequired,
  buttons: PropTypes.node.isRequired,
}

export default ButtonMenu
