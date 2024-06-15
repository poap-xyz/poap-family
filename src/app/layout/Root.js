import { useContext, useEffect } from 'react'
import { useFetcher, useNavigation, Outlet } from 'react-router-dom'
import { useAnalytics } from 'stores/analytics'
import { HTMLContext } from 'stores/html'
import Loading from 'components/Loading'
import CenterPage from 'components/CenterPage'

export default function Root() {
  const fetcher = useFetcher()
  const navigation = useNavigation()
  const { trackPageView, enableLinkTracking } = useAnalytics()
  const { title } = useContext(HTMLContext)

  useEffect(
    () => {
      document.title = title
    },
    [title]
  )

  useEffect(
    () => {
      if (title === 'POAP Family' && window.location.pathname !== '/') {
        return
      }
      trackPageView({
        href: window.location.href,
        documentTitle: title,
      })
      enableLinkTracking()
    },
    [title, trackPageView, enableLinkTracking]
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
