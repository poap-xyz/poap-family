import { Upload } from 'iconoir-react'
import { Drop } from 'models/drop'
import { POAP_MOMENTS_URL } from 'models/poap'
import LinkButton from 'components/LinkButton'
import ButtonMenu from 'components/ButtonMenu'

function EventButtonMomentsView({
  event,
}: {
  event: Drop
}) {
  return (
    <LinkButton
      title={`View uploaded moments on ${event.name}`}
      href={`${POAP_MOMENTS_URL}/drop/${event.id}`}
      external={true}
      secondary={true}
      icon={(
        <svg style={{ height: '16px', width: '16px' }} viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
          <path d="M13.3069 1.40933H11.9604C11.4851 0.994819 10.9307 0.746114 10.297 0.746114H8.31683C7.84158 0.331606 7.28713 0 6.57426 0H2.53465C1.10891 0.0829016 0 1.24352 0 2.65285V13.3471C0 14.7565 1.10891 16 2.53465 16H6.73267C7.36634 16 8 15.7513 8.47525 15.2539H10.4554C11.0891 15.2539 11.6436 15.0052 12.1188 14.5907H13.4653C14.8119 14.5907 16 13.4301 16 11.9378V4.06218C15.8416 2.65285 14.7327 1.40933 13.3069 1.40933ZM14.3366 12.0207C14.3366 12.601 13.8614 13.0984 13.3069 13.0984H12.8317C12.8317 12.9326 12.9109 12.8497 12.9109 12.6839V3.39896C12.9109 3.23316 12.9109 3.15026 12.8317 2.98446H13.3069C13.8614 2.98446 14.3366 3.48186 14.3366 4.06218V12.0207ZM1.50495 13.4301V2.65285C1.50495 2.07254 1.9802 1.57513 2.53465 1.57513H5.14851H6.57426H6.73267C7.20792 1.57513 7.52475 1.90674 7.68317 2.32124C7.68317 2.40414 7.76238 2.56995 7.76238 2.65285V13.3471C7.76238 13.4301 7.76238 13.5959 7.68317 13.6788C7.52475 14.0933 7.20792 14.4249 6.73267 14.4249H6.49505H5.14851H2.53465C1.90099 14.4249 1.50495 14.0104 1.50495 13.4301ZM9.18812 13.4301V13.1813V2.90155V2.65285C9.18812 2.56995 9.18812 2.40414 9.18812 2.32124H9.9802H10.3762C10.7723 2.32124 11.1683 2.56995 11.3267 2.98446C11.4059 3.15026 11.4059 3.23316 11.4059 3.39896V12.6839C11.4059 12.8497 11.4059 13.0155 11.3267 13.0984C11.1683 13.513 10.7723 13.7617 10.3762 13.7617H9.9802H9.18812C9.18812 13.5959 9.18812 13.513 9.18812 13.4301Z" />
        </svg>
      )}
    >
      Moments
    </LinkButton>
  )
}

function EventButtonMomentsPublish({
  event,
}: {
  event: Drop
}) {
  return (
    <LinkButton
      title={`Upload a moment on ${event.name}`}
      href={`${POAP_MOMENTS_URL}/upload?drop=${event.id}`}
      external={true}
      secondary={true}
      icon={<Upload />}
    >
      Publish
    </LinkButton>
  )
}

function EventButtonMoments({
  event,
  publish = true,
}: {
  event: Drop
  publish?: boolean
}) {
  if (!publish) {
    return (
      <EventButtonMomentsView event={event} />
    )
  }
  return (
    <ButtonMenu
      primary={
        <EventButtonMomentsView event={event} />
      }
      buttons={
        <EventButtonMomentsPublish event={event} />
      }
    />
  )
}

export default EventButtonMoments
