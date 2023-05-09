import { useContext, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { HTMLContext } from '../stores/html'
import { AdminContext } from '../stores/admin'
import CenterPage from '../components/CenterPage'
import Card from '../components/Card'
import InputPassphraseForm from '../components/InputPassphraseForm'
import ErrorMessage from '../components/ErrorMessage'
import Loading from '../components/Loading'
import ButtonLink from '../components/ButtonLink'

function Admin() {
  const { setTitle } = useContext(HTMLContext)
  const { authenticate, authenticated, passphrase, error, loading, reset } = useContext(AdminContext)

  useEffect(
    () => {
      setTitle('Enter Admin Passphrase')
    },
    [setTitle]
  )

  if (!passphrase) {
    return (
      <CenterPage>
        <Card style={{ padding: '4.5rem' }}>
          <InputPassphraseForm
            onSubmit={(passphrase) => authenticate(passphrase)}
          />
        </Card>
      </CenterPage>
    )
  }

  if (loading) {
    return (
      <CenterPage>
        <Card>
          <Loading />
        </Card>
      </CenterPage>
    )
  }

  if (!authenticated || error) {
    return (
      <CenterPage>
        <Card>
          <ErrorMessage>
            {error && error.message && <p>{error.message}</p>}
            {!authenticated && !error && <p>Access denied</p>}
          </ErrorMessage>
          <div className="footer">
            <ButtonLink onClick={() => reset()}>retry</ButtonLink>
          </div>
        </Card>
      </CenterPage>
    )
  }

  return (
    <Outlet />
  )
}

export default Admin
