import { Fragment } from 'react'
import Card from './Card'
import CollectionList from './CollectionList'
import WarningMessage from './WarningMessage'

function CollectionSet({
  collectionMap,
  showEmpty = true,
}) {
  const total = Object.values(collectionMap).reduce(
    (n, collections) => n + collections.length,
    0
  )

  if (total === 0) {
    if (!showEmpty) {
      return null
    }
    return (
      <WarningMessage>
        <h4>No collections</h4>
      </WarningMessage>
    )
  }

  const collectionEntries = Object.entries(collectionMap).filter(
    ([label, collections]) => collections.length > 0
  )

  return (
    <Card>
      {collectionEntries.map(([label, collections]) => (
        <Fragment key={label}>
          <h4>{label}</h4>
          <CollectionList collections={collections} />
        </Fragment>
      ))}
    </Card>
  )
}

export default CollectionSet
