import { useNavigate } from 'react-router-dom'
import { Expand } from 'iconoir-react'
import LinkButton from './LinkButton'
import Button from './Button'

function ButtonExpand({ addresses, eventIds, link = false, ...props }) {
  const navigate = useNavigate()

  const queryString = eventIds && Array.isArray(eventIds) && eventIds.length > 0
    ? `?events=${eventIds.join(',')}`
    : ''

  return (
    <div className="button-expand">
      {link
        ? (
          <LinkButton
            {...props}
            secondary={true}
            icon={<Expand />}
            href={`/addresses${queryString}#${addresses.join(',')}`}
          >
            Expand
          </LinkButton>
        )
        : (
          <Button
            {...props}
            secondary={true}
            icon={<Expand />}
            onClick={() => navigate(`/addresses${queryString}#${addresses.join(',')}`)}
          >
            Expand
          </Button>
        )
      }
    </div>
  )
}

export default ButtonExpand
