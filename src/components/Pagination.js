import Button from './Button'
import '../styles/pagination.css'

function Pagination({
  spread = 3,
  page,
  pages,
  total,
  onPage = (newPage) => {},
  children,
}) {
  const items = []
  const elements = []

  const renderElement = (current) => (
    <Button
      key={current}
      active={page === current}
      secondary={true}
      onClick={() => onPage(current)}
    >
      {current}
    </Button>
  )

  const renderBreak = (current) => (
    <span key={current} className="break">...</span>
  )

  if (pages <= spread) {
    for (let i = 0; i < pages; i++) {
      elements.push(renderElement(i + 1))
    }
  } else {
    let leftSide = spread / 2
    let rightSide = spread - leftSide

    if (page > pages - spread / 2) {
      rightSide = pages - page
      leftSide = spread - rightSide
    } else if (page < spread / 2) {
      leftSide = page
      rightSide = spread - leftSide
    }

    for (let i = 0; i < pages; i++) {
      const current = i + 1
      const adjustedRightSide = page === 1 && spread > 1 ? rightSide - 1 : rightSide

      if (current < spread + 1 || current > pages - spread || (current > page - leftSide && current <= page + adjustedRightSide)) {
        items.push({ type: 'page', page: current, element: renderElement(current) })
      } else if (items.length > 0 && items[items.length - 1].type !== 'break' && spread > 0) {
        items.push({ type: 'break', page: current, element: renderBreak(current) })
      }
    }

    for (let i = 0; i < items.length; i++) {
      if (
        items[i].type === 'break' &&
        items[i - 1] &&
        items[i - 1].type === 'page' &&
        items[i + 1] &&
        items[i + 1].type === 'page' &&
        items[i + 1].page - items[i - 1].page < 2
      ) {
        elements.push(renderElement(items[i].page))
      } else {
        elements.push(items[i].element)
      }
    }
  }

  return (
    <div className="pagination">
      {elements}
      {children}
    </div>
  )
}

export default Pagination
