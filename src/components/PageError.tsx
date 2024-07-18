import { ReactNode } from 'react'
import { useNavigate, useRouteError } from 'react-router-dom'
import CenterPage from 'components/CenterPage'
import ErrorMessage from 'components/ErrorMessage'
import ButtonLink from 'components/ButtonLink'

function PageError({
  children,
}: {
  children?: ReactNode
}) {
  const navigate = useNavigate()
  const error = useRouteError()

  console.error(error)

  const reload = () => {
    navigate(0)
  }

  return (
    <CenterPage>
      <ErrorMessage away={true} error={error} />
      {children}
      <ButtonLink onClick={() => reload()}>reload</ButtonLink>
    </CenterPage>
  )
}

export default PageError
