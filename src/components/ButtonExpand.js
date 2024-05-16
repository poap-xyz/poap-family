import PropTypes from 'prop-types'
import { useNavigate } from 'react-router-dom'
import { Expand } from 'iconoir-react'
import LinkButton from './LinkButton'
import Button from './Button'

/**
 * @param {PropTypes.InferProps<ButtonExpand.propTypes>} props
 */
function ButtonExpand({
  addresses,
  eventIds,
  link = false,
  title,
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

ButtonExpand.propTypes = {
  addresses: PropTypes.arrayOf(PropTypes.string).isRequired,
  eventIds: PropTypes.arrayOf(PropTypes.number),
  link: PropTypes.bool,
  title: PropTypes.string,
}

export default ButtonExpand
