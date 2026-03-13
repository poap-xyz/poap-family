import { useContext, useEffect } from 'react'
import packageJson from '../../package.json'
import { HTMLContext } from 'stores/html'
import { useSettings } from 'stores/settings'
import CenterPage from 'components/CenterPage'
import ExternalLink from 'components/ExternalLink'
import Search from 'components/Search'
import Welcome from 'components/Welcome'
import 'styles/home.css'

const VERSION_BASE_URL = process.env.REACT_APP_VERSION_BASE_URL

function Home() {
  const { settings } = useSettings()
  const { setTitle } = useContext(HTMLContext)

  useEffect(
    () => {
      setTitle('')
    },
    [setTitle]
  )

  return (
    <CenterPage>
      {!settings.welcomeShown && (
        <Welcome showHelp={true} />
      )}
      <Search />
      <div className="footer">
        <ExternalLink
          className="link"
          href="https://poap.notion.site/POAP-Family-FAQ-cef29bc0bb8c4f8f936164d988a944cc"
        >
          faq
        </ExternalLink>
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
