import { useContext, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { SettingsContext } from '../stores/cache'
import { HTMLContext } from '../stores/html'
import ButtonLink from '../components/ButtonLink'
import Card from '../components/Card'
import CenterPage from '../components/CenterPage'
import Switch from '../components/Switch'
import '../styles/settings.css'

function Settings() {
  const navigate = useNavigate()
  const { settings, set } = useContext(SettingsContext)
  const { setTitle } = useContext(HTMLContext)

  useEffect(
    () => {
      setTitle('Settings')
    },
    [setTitle]
  )

  const handleShowLastEvents = (event) => {
    set('showLastEvents', !!event.target.checked)
  }
  const handleAutoScrollCollectors = (event) => {
    set('autoScrollCollectors', !!event.target.checked)
  }
  const handleOpenProfiles = (event) => {
    set('openProfiles', !!event.target.checked)
  }
  const handleShowCollections = (event) => {
    set('showCollections', !!event.target.checked)
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
              checked={settings && settings.showLastEvents}
              onChange={handleShowLastEvents}
            />
          </div>
        </div>
        <div className="setting">
          <label className="label">Auto scroll collectors</label>
          <div className="input">
            <Switch
              id="autoScrollCollectors"
              checked={settings && settings.autoScrollCollectors}
              onChange={handleAutoScrollCollectors}
            />
          </div>
        </div>
        <div className="setting">
          <label className="label">Open profiles</label>
          <div className="input">
            <Switch
              id="openProfiles"
              checked={settings && settings.openProfiles}
              onChange={handleOpenProfiles}
            />
          </div>
        </div>
        <div className="setting">
          <label className="label">Show collections</label>
          <div className="input">
            <Switch
              id="showCollections"
              checked={settings && settings.showCollections}
              onChange={handleShowCollections}
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
