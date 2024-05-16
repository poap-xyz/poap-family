import PropTypes from 'prop-types'
import { Plus } from 'iconoir-react'
import Button from './Button'

/**
 * @param {PropTypes.InferProps<ButtonAdd.propTypes>} props
 */
function ButtonAdd({
  onAdd = () => {},
  ...props
}) {
  return (
    <Button
      {...props}
      secondary={true}
      borderless={true}
      icon={<Plus />}
      onClick={() => onAdd()}
    >
      add
    </Button>
  )
}

ButtonAdd.propTypes = {
  onAdd: PropTypes.func.isRequired,
  ...Button.propTypes,
}

export default ButtonAdd
