import { useContext, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSettings } from 'stores/settings'
import { HTMLContext } from 'stores/html'
import ButtonLink from 'components/ButtonLink'
import Card from 'components/Card'
import CenterPage from 'components/CenterPage'
import Switch from 'components/Switch'
import 'styles/settings.css'

function Settings() {
  const navigate = useNavigate()
  const { settings, setSetting } = useSettings()
  const { setTitle } = useContext(HTMLContext)

  useEffect(
    () => {
      setTitle('Settings')
    },
    [setTitle]
  )

  function handleShowLastEvents(checked: boolean): void {
    setSetting('showLastEvents', checked)
  }

  return (
    <CenterPage>
      <Card>
        <h4>Settings</h4>
        <div className="setting">
          <label className="label">Show last drops</label>
          <div className="input">
            <Switch
              id="showLastEvents"
              checked={settings.showLastEvents}
              onChange={handleShowLastEvents}
            />
          </div>
        </div>
      </Card>
      <div className="footer">
        <ButtonLink onClick={() => navigate('/')}>back</ButtonLink>
      </div>
    </CenterPage>
  )
}

export default Settings
