import { useContext, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { HTMLContext } from '../stores/html'
import ButtonLink from '../components/ButtonLink'
import LastEvents from '../components/LastEvents'
import Page from '../components/Page'

const DEFAULT_PAGE = 1
const DEFAULT_PER_PAGE = 8

function Last() {
  const navigate = useNavigate()
  const { setTitle } = useContext(HTMLContext)
  const [searchParams, setSearchParams] = useSearchParams()

  const currentPage = searchParams.has('page') ? parseInt(searchParams.get('page')) : DEFAULT_PAGE
  const perPage = searchParams.has('qty') ? parseInt(searchParams.get('qty')) : DEFAULT_PER_PAGE

  useEffect(
    () => {
      setTitle('Last Cached Drops')
    },
    [setTitle]
  )

  useEffect(
    () => {
      if (!searchParams.has('page')) {
        if (perPage !== DEFAULT_PER_PAGE) {
          setSearchParams({ page: currentPage, qty: perPage })
        } else {
          setSearchParams({ page: currentPage })
        }
      }
    },
    [currentPage, perPage, searchParams, setSearchParams]
  )

  const changePage = (page, qty) => {
    if (qty && qty !== DEFAULT_PER_PAGE) {
      setSearchParams({ page, qty })
    } else {
      if (perPage !== DEFAULT_PER_PAGE) {
        setSearchParams({ page, qty: perPage })
      } else {
        setSearchParams({ page })
      }
    }
  }

  return (
    <Page>
      <LastEvents
        currentPage={currentPage}
        onPageChange={changePage}
        perPage={perPage}
        showPerPage={true}
      />
      <div className="footer">
        <ButtonLink onClick={() => navigate('/')}>back</ButtonLink>
      </div>
    </Page>
  )
}

export default Last
