import { useContext, useEffect } from 'react'
import { useFetcher, useNavigation, Outlet } from 'react-router-dom'
import { useMatomo } from '@datapunt/matomo-tracker-react'
import { HTMLContext } from '../stores/html'
import Loading from '../components/Loading'
import CenterPage from '../components/CenterPage'

function Root() {
  const fetcher = useFetcher()
  const navigation = useNavigation()
  const { trackPageView } = useMatomo()
  const { title } = useContext(HTMLContext)

  useEffect(
    () => {
      document.title = title
    },
    [title]
  )

  useEffect(
    () => {
      trackPageView({
        href: window.location.href,
        documentTitle: title,
      })
    },
    [title, trackPageView]
  )

  if (fetcher.state === 'loading' || navigation.state === 'loading') {
    return (
      <CenterPage>
        <Loading />
      </CenterPage>
    )
  }
  return (
    <Outlet />
  )
}

export default Root
