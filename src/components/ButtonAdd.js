import PropTypes from 'prop-types'
import { Plus } from 'iconoir-react'
import Button from 'components/Button'

/**
 * @param {PropTypes.InferProps<ButtonAdd.propTypes>} props
 */
function ButtonAdd({
  onAdd = () => {},
  title,
}) {
  return (
    <Button
      title={title}
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
  title: PropTypes.string,
}

export default ButtonAdd
