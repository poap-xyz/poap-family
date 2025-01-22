import { ReactNode } from 'react'
import { POAP_GALLERY_URL } from 'models/poap'
import ButtonGroup from 'components/ButtonGroup'
import LinkButton from 'components/LinkButton'

function DropButtonGroup({
  dropId,
  children,
  viewInGallery = true,
  right = false,
}: {
  dropId: number
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
          href={`${POAP_GALLERY_URL}/${dropId}`}
          external={true}
        >
          View in Gallery
        </LinkButton>
      )}
      {children}
    </ButtonGroup>
  )
}

export default DropButtonGroup
