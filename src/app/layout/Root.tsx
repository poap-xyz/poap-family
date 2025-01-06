import { useContext, useEffect } from 'react'
import { useFetcher, useNavigation, Outlet } from 'react-router-dom'
import { HTMLContext } from 'stores/html'
import Loading from 'components/Loading'
import CenterPage from 'components/CenterPage'

export default function Root() {
  const fetcher = useFetcher()
  const navigation = useNavigation()
  const { title } = useContext(HTMLContext)

  useEffect(
    () => {
      document.title = title
    },
    [title]
  )

  if (fetcher.state === 'loading' || navigation.state === 'loading') {
    return (
      <CenterPage>
        <Loading size="big" />
      </CenterPage>
    )
  }

  return (
    <Outlet />
  )
}
