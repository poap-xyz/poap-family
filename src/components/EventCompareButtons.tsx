import { Drop } from 'models/drop'
import { InCommon } from 'models/api'
import EventButtonGroup from 'components/EventButtonGroup'
import ButtonExportAddressCsv from 'components/ButtonExportAddressCsv'
import ButtonExpand from 'components/ButtonExpand'

function EventCompareButtons({
  eventId,
  eventIds,
  events,
  inCommon,
  viewInGallery = true,
}: {
  eventId: number
  eventIds: number[]
  events: Record<number, Drop>
  inCommon: InCommon
  viewInGallery?: boolean
}) {
  const compareItself = (
    eventIds.length === 1 && String(eventId) === String(eventIds[0])
  )

  return (
    <EventButtonGroup
      event={events[eventId]}
      viewInGallery={viewInGallery}
    >
      {eventIds.length > 0 && (
        <>
          <ButtonExportAddressCsv
            filename={
              compareItself
                ? `collectors-${eventId}`
                : `collectors-${eventId}-in-common-drops-${eventIds.join('+')}`
            }
            name={
              compareItself
                ? events[eventIds[0]].name
                : undefined
            }
            addresses={inCommon[eventId]}
            title={
              compareItself
                ? `Generates CSV file with collectors of drop #${eventId}`
                : `Generates CSV file with collectors in common between ` +
                  `drops #${eventId} and #${eventIds.join(', #')}`
            }
          />
          <ButtonExpand
            addresses={inCommon[eventId]}
            title={
              compareItself
                ? `Expands collectors of drop #${eventId}`
                : `Expands collectors in common between ` +
                  `drops #${eventId} and #${eventIds.join(', #')}`
            }
          />
        </>
      )}
    </EventButtonGroup>
  )
}

export default EventCompareButtons
