import { useContext, useEffect } from 'react'
import { Link } from 'react-router-dom'
import packageJson from '../../package.json'
import { HTMLContext } from '../stores/html'
import { SettingsContext } from '../stores/cache'
import CenterPage from '../components/CenterPage'
import Search from '../components/Search'
import Welcome from '../components/Welcome'
import LastEvents from '../components/LastEvents'
import '../styles/home.css'

const VERSION_BASE_URL = process.env.REACT_APP_VERSION_BASE_URL

function Home() {
  const { settings } = useContext(SettingsContext)
  const { setTitle } = useContext(HTMLContext)

  useEffect(
    () => {
      setTitle()
    },
    [setTitle]
  )

  return (
    <CenterPage>
      {settings && !settings.welcomeShown && <Welcome />}
      <Search />
      <div className="drop-lists">
        {settings && settings.showLastEvents && (
          <LastEvents
            perPage={3}
            showRefresh={true}
            showMore={true}
            maxPages={3}
            moreQty={10}
          />
        )}
      </div>
      <div className="footer">
        <Link className="link" to="/last">last</Link>
        <span className="dot">·</span>
        <Link className="link" to="/settings">settings</Link>
        <span className="dot">·</span>
        <a className="link" href="https://poap.notion.site/POAP-Family-FAQ-cef29bc0bb8c4f8f936164d988a944cc" target="_blank" rel="noopener noreferrer">faq</a>
        <span className="dot">·</span>
        <span className="text version">
          {VERSION_BASE_URL
            ? (
              <a href={`${VERSION_BASE_URL}/v${packageJson.version}`}>
                v{packageJson.version.split('.').slice(0, -1).join('.')}
              </a>
            )
            : `v${packageJson.version.split('.').slice(0, -1).join('.')}`
          }
        </span>
      </div>
    </CenterPage>
  )
}

export default Home
