import PropTypes from 'prop-types'
import { EditPencil } from 'iconoir-react'
import Button from 'components/Button'

/**
 * @param {PropTypes.InferProps<ButtonEdit.propTypes>} props
 */
function ButtonEdit({
  onEdit = () => {},
  ...props
}) {
  return (
    <Button
      {...props}
      icon={<EditPencil />}
      onClick={() => onEdit()}
    >
      edit
    </Button>
  )
}

ButtonEdit.propTypes = {
  onEdit: PropTypes.func.isRequired,
  ...Button.propTypes,
}

export default ButtonEdit
