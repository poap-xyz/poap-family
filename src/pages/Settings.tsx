import { useContext, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { HTMLContext } from 'stores/html'
import ButtonLink from 'components/ButtonLink'
import Card from 'components/Card'
import CenterPage from 'components/CenterPage'
import 'styles/settings.css'

function Settings() {
  const navigate = useNavigate()
  const { setTitle } = useContext(HTMLContext)

  useEffect(
    () => {
      setTitle('Settings')
    },
    [setTitle]
  )

  return (
    <CenterPage>
      <Card>
        <h4>Settings</h4>
      </Card>
      <div className="footer">
        <ButtonLink onClick={() => navigate('/')}>back</ButtonLink>
      </div>
    </CenterPage>
  )
}

export default Settings
