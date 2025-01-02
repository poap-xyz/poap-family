import { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { joinDropIds } from 'models/drop'
import ButtonGroup from 'components/ButtonGroup'
import ButtonAdd from 'components/ButtonAdd'

function DropNavigateButtons({
  baseDropIds,
  dropId,
  children,
}: {
  baseDropIds: number[]
  dropId: number
  children?: ReactNode
}) {
  const navigate = useNavigate()

  const addDrop = () => {
    navigate(`/drops/${joinDropIds([...baseDropIds, dropId])}`)
  }

  return (
    <ButtonGroup>
      {baseDropIds.length > 0 && !baseDropIds.includes(dropId) && (
        <ButtonAdd
          onAdd={() => addDrop()}
          title={`Combines drop #${dropId} to #${baseDropIds.join(', #')}`}
        />
      )}
      {children}
    </ButtonGroup>
  )
}

export default DropNavigateButtons
