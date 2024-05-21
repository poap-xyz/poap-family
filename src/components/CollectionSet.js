import PropTypes from 'prop-types'
import { Fragment } from 'react'
import { CollectionProps } from 'models/collection'
import Card from 'components/Card'
import CollectionList from 'components/CollectionList'
import WarningMessage from 'components/WarningMessage'

/**
 * @param {PropTypes.InferProps<CollectionSet.propTypes>} props
 */
function CollectionSet({
  collectionMap,
  showEmpty = true,
  emptyMessage = 'No collections',
}) {
  /**
   * @type {number}
   */
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

CollectionSet.propTypes = {
  collectionMap: (
    PropTypes.objectOf(
      PropTypes.arrayOf(
        PropTypes.shape(CollectionProps)
      )
    ).isRequired
  ),
  showEmpty: PropTypes.bool,
  emptyMessage: PropTypes.node,
}

export default CollectionSet
