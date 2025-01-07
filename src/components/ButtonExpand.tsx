import { useNavigate } from 'react-router-dom'
import { Expand } from 'iconoir-react'
import LinkButton from 'components/LinkButton'
import Button from 'components/Button'

function ButtonExpand({
  addresses,
  dropIds,
  link = false,
  title,
}: {
  addresses?: string[]
  dropIds?: number[]
  link?: boolean
  title?: string
}) {
  const navigate = useNavigate()

  const queryString = (
    dropIds && Array.isArray(dropIds) && dropIds.length > 0
      ? `?events=${dropIds.join(',')}`
      : ''
  )

  return (
    <div className="button-expand">
      {link
        ? (
          <LinkButton
            title={title}
            secondary={true}
            loading={addresses == null}
            icon={<Expand />}
            href={
              addresses == null
                ? '#'
                : `/addresses${queryString}#${addresses.join(',')}`
            }
          >
            Expand
          </LinkButton>
        )
        : (
          <Button
            title={title}
            secondary={true}
            loading={addresses == null}
            icon={<Expand />}
            onClick={() => {
              if (addresses == null) {
                return
              }
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
