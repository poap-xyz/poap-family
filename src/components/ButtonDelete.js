import PropTypes from 'prop-types'
import { Minus } from 'iconoir-react'
import Button from './Button'

/**
 * @param {PropTypes.InferProps<ButtonDelete.propTypes>} props
 */
function ButtonDelete({
  onDelete = () => {},
  ...props
}) {
  return (
    <Button
      {...props}
      secondary={true}
      icon={<Minus />}
      onClick={() => onDelete()}
    >
      del
    </Button>
  )
}

ButtonDelete.propTypes = {
  onDelete: PropTypes.func.isRequired,
  ...Button.propTypes,
}

export default ButtonDelete
