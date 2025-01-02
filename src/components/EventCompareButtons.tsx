import { Drop } from 'models/drop'
import { InCommon } from 'models/api'
import EventButtonGroup from 'components/EventButtonGroup'
import ButtonExportAddressCsv from 'components/ButtonExportAddressCsv'
import ButtonExpand from 'components/ButtonExpand'

function EventCompareButtons({
  dropId,
  dropIds,
  drops,
  inCommon,
  viewInGallery = true,
}: {
  dropId: number
  dropIds: number[]
  drops: Record<number, Drop>
  inCommon: InCommon
  viewInGallery?: boolean
}) {
  const compareItself = (
    dropIds.length === 1 && String(dropId) === String(dropIds[0])
  )

  return (
    <EventButtonGroup
      drop={drops[dropId]}
      viewInGallery={viewInGallery}
    >
      {dropIds.length > 0 && (
        <>
          <ButtonExportAddressCsv
            filename={
              compareItself
                ? `collectors-${dropId}`
                : `collectors-${dropId}-in-common-drops-${dropIds.join('+')}`
            }
            name={
              compareItself
                ? drops[dropIds[0]].name
                : undefined
            }
            addresses={inCommon[dropId]}
            title={
              compareItself
                ? `Generates CSV file with collectors of drop #${dropId}`
                : `Generates CSV file with collectors in common between ` +
                  `drops #${dropId} and #${dropIds.join(', #')}`
            }
          />
          <ButtonExpand
            addresses={inCommon[dropId]}
            title={
              compareItself
                ? `Expands collectors of drop #${dropId}`
                : `Expands collectors in common between ` +
                  `drops #${dropId} and #${dropIds.join(', #')}`
            }
          />
        </>
      )}
    </EventButtonGroup>
  )
}

export default EventCompareButtons
