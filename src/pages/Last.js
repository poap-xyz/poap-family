import { useContext, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { HTMLContext } from '../stores/html'
import ButtonLink from '../components/ButtonLink'
import LastEvents from '../components/LastEvents'
import Page from '../components/Page'

function Last() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { setTitle } = useContext(HTMLContext)

  useEffect(
    () => {
      setTitle('Last Cached Drops')
    },
    [setTitle]
  )

  const changePage = (page) => {
    setSearchParams({ page })
  }

  return (
    <Page>
      <LastEvents
        currentPage={searchParams.has('page') ? parseInt(searchParams.get('page')) : 1}
        onPageChange={changePage}
        qty={8}
      />
      <div className="footer">
        <ButtonLink onClick={() => navigate('/')}>back</ButtonLink>
      </div>
    </Page>
  )
}

export default Last
