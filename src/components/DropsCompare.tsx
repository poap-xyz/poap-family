import { useContext, useMemo, useState } from 'react'
import {
  InCommon,
  getAddressInCommonAddresses,
  getAddressInCommonDropIds,
} from 'models/in-common'
import { useDrops } from 'stores/drops'
import { ReverseEnsContext } from 'stores/ethereum'
import { intersection } from 'utils/array'
import { getColorForSeed } from 'utils/color'
import Card from 'components/Card'
import ErrorMessage from 'components/ErrorMessage'
import DropHeader from 'components/DropHeader'
import AddressCollectorLine from 'components/AddressCollectorLine'
import DropCompareButtons from 'components/DropCompareButtons'
import DropNavigateButtons from 'components/DropNavigateButtons'
import ButtonClose from 'components/ButtonClose'
import 'styles/drops-compare.css'

function DropsCompare({
  baseDropIds,
  dropIds,
  inCommon,
  onClose,
}: {
  baseDropIds: number[]
  dropIds: number[]
  inCommon: InCommon
  onClose: (dropId: number) => void
}) {
  const { getEnsName } = useContext(ReverseEnsContext)
  const [highlighted, setHighlighted] = useState<string | null>(null)

  const {
    drops,
    loading,
    error,
    errors,
  } = useDrops()

  const adressesColors = useMemo(
    () => (
      dropIds.length < 2
        ? {}
        : Object.fromEntries(
            intersection(
              ...dropIds.map((dropId) => inCommon[dropId])
            )
            .map(
              (address) => [
                address,
                getColorForSeed(address),
              ]
            )
          )
    ),
    [dropIds, inCommon]
  )

  function onCollectorEnter(collectorDropId: number, collector: string): void {
    setHighlighted((current) => (
      current !== collector && collector in adressesColors ? collector : current
    ))
  }

  function onCollectorLeave(collectorDropId: number, collector: string): void {
    setHighlighted((current) => (
      current === collector && collector in adressesColors ? null : current
    ))
  }

  return (
    <div className="drops-compare">
      {error && (
        <ErrorMessage error={error} />
      )}
      {dropIds.map((dropId) =>
        <div className="drop-compare" key={dropId}>
          <Card>
            <DropHeader
              dropId={dropId}
              drop={drops[dropId]}
              loading={loading[dropId]}
              error={errors[dropId]}
              size={48}
            />
            <div className="drop-compare-actions">
              <DropNavigateButtons
                baseDropIds={baseDropIds}
                dropId={dropId}
              >
                {onClose && (
                  <ButtonClose
                    onClose={() => onClose(dropId)}
                    className="drop-compare-actions-close"
                  />
                )}
              </DropNavigateButtons>
            </div>
            <h4>
              {inCommon[dropId].length}{' '}
              collector{inCommon[dropId].length === 1 ? '' : 's'}
              {' '}in common
            </h4>
            <div className="drop-compare-collectors">
              <ul className="collectors">
                {inCommon[dropId].map((collector) => {
                  const inCommonDropIds = getAddressInCommonDropIds(
                    inCommon,
                    collector
                  )
                  const inCommonAddresses = getAddressInCommonAddresses(
                    inCommon,
                    inCommonDropIds,
                    collector
                  )
                  return (
                    <li
                      key={collector}
                      style={{
                        backgroundColor:
                          collector in adressesColors &&
                          (
                            !highlighted ||
                            highlighted === collector
                          )
                            ? adressesColors[collector]
                            : undefined,
                      }}
                      onMouseEnter={() => {
                        onCollectorEnter(dropId, collector)
                      }}
                      onMouseLeave={() => {
                        onCollectorLeave(dropId, collector)
                      }}
                    >
                      <AddressCollectorLine
                        ens={getEnsName(collector)}
                        address={collector}
                        inCommonDropIds={inCommonDropIds}
                        inCommonAddresses={inCommonAddresses}
                        linkToScan={
                          !highlighted || highlighted === collector}
                      />
                    </li>
                  )
                })}
              </ul>
            </div>
            <DropCompareButtons
              dropId={dropId}
              dropIds={baseDropIds}
              inCommon={inCommon}
              viewInGallery={true}
            />
          </Card>
        </div>
      )}
    </div>
  )
}

export default DropsCompare
