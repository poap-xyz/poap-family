import PropTypes from 'prop-types'
import { Minus } from 'iconoir-react'
import Button from './Button'

/**
 * @param {PropTypes.InferProps<ButtonDelete.propTypes>} props
 */
function ButtonDelete({
  onDelete = () => {},
  title,
}) {
  return (
    <Button
      title={title}
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
  title: PropTypes.string,
}

export default ButtonDelete
