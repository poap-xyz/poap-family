import PropTypes from 'prop-types'
import { EditPencil } from 'iconoir-react'
import Button from 'components/Button'

/**
 * @param {PropTypes.InferProps<ButtonEdit.propTypes>} props
 */
function ButtonEdit({
  onEdit = () => {},
  title,
}) {
  return (
    <Button
      title={title}
      secondary={true}
      borderless={true}
      icon={<EditPencil />}
      onClick={() => onEdit()}
    >
      edit
    </Button>
  )
}

ButtonEdit.propTypes = {
  onEdit: PropTypes.func.isRequired,
  title: PropTypes.string,
}

export default ButtonEdit
