import PropTypes from 'prop-types'
import { useContext, useEffect } from 'react'
import { LazyImage } from 'react-lazy-images'
import { ResolverEnsContext } from 'stores/ethereum'
import Loading from 'components/Loading'
import ErrorMessage from 'components/ErrorMessage'
import 'styles/ens-avatar.css'

/**
 * @param {PropTypes.InferProps<EnsAvatar.propTypes>} props
 */
function EnsAvatar({ ens }) {
  const { avatars, resolveMeta } = useContext(ResolverEnsContext)

  useEffect(
    () => {
      resolveMeta(ens)
    },
    [ens, resolveMeta]
  )

  const hasAvatarImage = (
    ens in avatars &&
    avatars[ens] != null &&
    typeof avatars[ens] === 'string' &&
    avatars[ens].startsWith('http') &&
    !avatars[ens].endsWith('json')
  )

  if (!hasAvatarImage) {
    return null
  }

  return (
    <LazyImage
      className="ens-avatar"
      src={avatars[ens]}
      alt={`Avatar of ${ens}`}
      placeholder={({ imageProps, ref }) => (
        <img ref={ref} {...imageProps} /> // eslint-disable-line jsx-a11y/alt-text
      )}
      actual={({ imageProps }) => (
        <img {...imageProps} /> // eslint-disable-line jsx-a11y/alt-text
      )}
      loading={() => (
        <div className="ens-avatar">
          <Loading small={true} />
        </div>
      )}
      error={() => (
        <div className="ens-avatar">
          <ErrorMessage message="Could not be loaded" />
        </div>
      )}
    />
  )
}

EnsAvatar.propTypes = {
  ens: PropTypes.string.isRequired,
}

export default EnsAvatar
