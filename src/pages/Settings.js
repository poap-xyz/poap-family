import { useContext, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { SettingsContext } from 'stores/cache'
import { HTMLContext } from 'stores/html'
import ButtonLink from 'components/ButtonLink'
import Card from 'components/Card'
import CenterPage from 'components/CenterPage'
import Switch from 'components/Switch'
import 'styles/settings.css'

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

  /**
   * @param {boolean} checked
   */
  const handleShowLastEvents = (checked) => {
    set('showLastEvents', checked)
  }
  /**
   * @param {boolean} checked
   */
  const handleAutoScrollCollectors = (checked) => {
    set('autoScrollCollectors', checked)
  }
  /**
   * @param {boolean} checked
   */
  const handleOpenProfiles = (checked) => {
    set('openProfiles', checked)
  }
  /**
   * @param {boolean} checked
   */
  const handleShowCollections = (checked) => {
    set('showCollections', checked)
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
              onChange={(event) => {
                handleShowLastEvents(event.target.checked)
              }}
            />
          </div>
        </div>
        <div className="setting">
          <label className="label">Auto scroll collectors</label>
          <div className="input">
            <Switch
              id="autoScrollCollectors"
              checked={settings && settings.autoScrollCollectors}
              onChange={(event) => {
                handleAutoScrollCollectors(event.target.checked)
              }}
            />
          </div>
        </div>
        <div className="setting">
          <label className="label">Open profiles</label>
          <div className="input">
            <Switch
              id="openProfiles"
              checked={settings && settings.openProfiles}
              onChange={(event) => {
                handleOpenProfiles(event.target.checked)
              }}
            />
          </div>
        </div>
        <div className="setting">
          <label className="label">Show collections</label>
          <div className="input">
            <Switch
              id="showCollections"
              checked={settings && settings.showCollections}
              onChange={(event) => {
                handleShowCollections(event.target.checked)
              }}
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
