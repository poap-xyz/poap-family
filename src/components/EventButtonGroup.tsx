import { POAP_GALLERY_URL } from 'models/poap'
import { Drop } from 'models/drop'
import ButtonGroup from 'components/ButtonGroup'
import LinkButton from 'components/LinkButton'
import { ReactNode } from 'react'

function EventButtonGroup({
  drop,
  children,
  viewInGallery = true,
  right = false,
}: {
  drop: Drop
  children?: ReactNode
  viewInGallery?: boolean
  right?: boolean
}) {
  if (!viewInGallery && children == null) {
    return null
  }

  return (
    <ButtonGroup right={right}>
      {viewInGallery && (
        <LinkButton
          href={`${POAP_GALLERY_URL}/${drop.id}`}
          external={true}
        >
          View in Gallery
        </LinkButton>
      )}
      {children}
    </ButtonGroup>
  )
}

export default EventButtonGroup
