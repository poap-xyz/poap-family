import { useContext, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { HTMLContext } from '../stores/html'
import { getSearchParamNumber } from '../utils/number'
import ButtonLink from '../components/ButtonLink'
import LastEvents from '../components/LastEvents'
import Page from '../components/Page'

const DEFAULT_PAGE = 1
const DEFAULT_PER_PAGE = 8

function Last() {
  const navigate = useNavigate()
  const { setTitle } = useContext(HTMLContext)
  const [searchParams, setSearchParams] = useSearchParams()

  const page = getSearchParamNumber(searchParams, 'page', DEFAULT_PAGE)
  const perPage = getSearchParamNumber(searchParams, 'qty', DEFAULT_PER_PAGE)

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
          setSearchParams({ page, qty: perPage })
        } else {
          setSearchParams({ page })
        }
      }
    },
    [page, perPage, searchParams, setSearchParams]
  )

  const changePage = (newPage, newPerPage) => {
    if (newPerPage && newPerPage !== DEFAULT_PER_PAGE) {
      setSearchParams({ page: newPage, qty: newPerPage })
    } else if (perPage !== DEFAULT_PER_PAGE) {
      setSearchParams({ page: newPage, qty: perPage })
    } else {
      setSearchParams({ page: newPage })
    }
  }

  return (
    <Page>
      <LastEvents
        page={page}
        perPage={perPage}
        onPageChange={changePage}
        showPerPage={true}
      />
      <div className="footer">
        <ButtonLink onClick={() => navigate('/')}>back</ButtonLink>
      </div>
    </Page>
  )
}

export default Last
