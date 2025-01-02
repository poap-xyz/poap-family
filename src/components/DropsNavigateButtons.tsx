import { useNavigate } from 'react-router-dom'
import { joinDropIds } from 'models/drop'
import ButtonGroup from 'components/ButtonGroup'
import Button from 'components/Button'

function DropsNavigateButtons({
  baseDropIds,
  dropIds,
}: {
  baseDropIds: number[]
  dropIds: number[]
}) {
  const navigate = useNavigate()

  function addDrops(): void {
    if (dropIds.length === 0) {
      return
    }
    const newEventIds = [...baseDropIds, ...dropIds]
    if (newEventIds.length > 0) {
      navigate(`/drops/${joinDropIds(newEventIds)}`)
    } else if (newEventIds.length === 1) {
      navigate(`/drop/${newEventIds[0]}`)
    }
  }

  function openDrops(): void {
    if (dropIds.length === 0) {
      return
    }
    if (dropIds.length > 1) {
      navigate(`/drops/${joinDropIds(dropIds)}`)
    } else if (dropIds.length === 1) {
      navigate(`/drop/${dropIds[0]}`)
    }
  }

  return (
    <ButtonGroup right={true}>
      {baseDropIds.length > 0 && (
        <Button
          disabled={
            dropIds.length === 0 ||
            dropIds.every(
              (dropId) => baseDropIds.includes(dropId)
            )
          }
          onClick={() => addDrops()}
          title={`Combines drops #${dropIds.join(', #')} to #${baseDropIds.join(', #')}`}
        >
          Add selected
        </Button>
      )}
      <Button
        secondary={true}
        disabled={
          dropIds.length === 0 ||
          (
            dropIds.every(
              (dropId) => baseDropIds.includes(dropId)
            ) &&
            baseDropIds.every(
              (dropId) => dropIds.includes(dropId)
            )
          )
        }
        onClick={() => openDrops()}
        title={`Open drops #${dropIds.join(', #')}`}
      >
        Open {baseDropIds.length === 0 && ' selected'}
      </Button>
    </ButtonGroup>
  )
}

export default DropsNavigateButtons
