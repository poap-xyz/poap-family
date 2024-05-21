import PropTypes from 'prop-types'
import { useNavigate, useRouteError } from 'react-router-dom'
import CenterPage from 'components/CenterPage'
import ErrorMessage from 'components/ErrorMessage'
import ButtonLink from 'components/ButtonLink'

/**
 * @param {PropTypes.InferProps<PageError.propTypes>} props
 */
function PageError({
  children,
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

PageError.propTypes = {
  children: PropTypes.node,
}

export default PageError
