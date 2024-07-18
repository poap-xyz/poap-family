import { Fragment, ReactNode } from 'react'
import { Collection } from 'models/collection'
import Card from 'components/Card'
import CollectionList from 'components/CollectionList'
import WarningMessage from 'components/WarningMessage'

function CollectionSet({
  collectionMap,
  showEmpty = true,
  emptyMessage = 'No collections',
}: {
  collectionMap: Record<string, Collection[]>
  showEmpty?: boolean
  emptyMessage?: ReactNode
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
        {emptyMessage}
      </WarningMessage>
    )
  }

  const collectionEntries = Object.entries(collectionMap).filter(
    ([, collections]) => collections.length > 0
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
