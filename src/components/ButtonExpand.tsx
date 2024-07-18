import { useNavigate } from 'react-router-dom'
import { Expand } from 'iconoir-react'
import LinkButton from 'components/LinkButton'
import Button from 'components/Button'

function ButtonExpand({
  addresses,
  eventIds,
  link = false,
  title,
}: {
  addresses: string[]
  eventIds?: number[]
  link?: boolean
  title?: string
}) {
  const navigate = useNavigate()

  const queryString = (
    eventIds && Array.isArray(eventIds) && eventIds.length > 0
      ? `?events=${eventIds.join(',')}`
      : ''
  )

  return (
    <div className="button-expand">
      {link
        ? (
          <LinkButton
            title={title}
            secondary={true}
            icon={<Expand />}
            href={`/addresses${queryString}#${addresses.join(',')}`}
          >
            Expand
          </LinkButton>
        )
        : (
          <Button
            title={title}
            secondary={true}
            icon={<Expand />}
            onClick={() => {
              navigate(`/addresses${queryString}#${addresses.join(',')}`)
            }}
          >
            Expand
          </Button>
        )
      }
    </div>
  )
}

export default ButtonExpand
