import PropTypes from 'prop-types'
import { clsx } from 'clsx'
import 'styles/card.css'

/**
 * @param {PropTypes.InferProps<Card.propTypes>} props
 */
function Card({
  children,
  fat = false,
  shink = false,
  ilustration,
}) {
  return (
    <section className="card">
      <div
        className={clsx('card-content', { fat, shink })}
        style={ilustration
          ? {
              backgroundImage: `url(${ilustration.url})`,
              backgroundPosition: ilustration.pos ?? '0 0',
            }
          : undefined
        }
      >
        {children}
      </div>
    </section>
  )
}

Card.propTypes = {
  children: PropTypes.node.isRequired,
  fat: PropTypes.bool,
  shink: PropTypes.bool,
  ilustration: PropTypes.shape({
    url: PropTypes.string.isRequired,
    pos: PropTypes.string,
  })
}

export default Card
