import { useContext, useEffect } from 'react'
import { LazyImage } from 'react-lazy-images'
import { ResolverEnsContext } from 'stores/ethereum'
import Loading from 'components/Loading'
import ErrorMessage from 'components/ErrorMessage'
import 'styles/ens-avatar.css'

function EnsAvatar({ ens }: { ens: string }) {
  const { resolveMeta, getMeta } = useContext(ResolverEnsContext)

  useEffect(
    () => {
      resolveMeta(ens)
    },
    [ens, resolveMeta]
  )

  const meta = getMeta(ens)

  const hasAvatarImage = (
    meta != null &&
    meta.avatar != null &&
    typeof meta.avatar === 'string' &&
    meta.avatar.startsWith('http') &&
    !meta.avatar.endsWith('json')
  )

  if (!hasAvatarImage) {
    return null
  }

  return (
    <LazyImage
      className="ens-avatar"
      src={meta.avatar}
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

export default EnsAvatar
