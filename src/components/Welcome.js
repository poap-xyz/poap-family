import { useContext } from 'react'
import { SettingsContext } from '../stores/cache'
import ButtonLink from './ButtonLink'
import ExternalLink from './ExternalLink'
import '../styles/welcome.css'

function Welcome() {
  const { set } = useContext(SettingsContext)

  const handleDismiss = () => {
    set('welcomeShown', true)
  }

  return (
    <div className="welcome">
      <div className="welcome-content">
        Explore POAPs collections have in common.{' '}
        <ExternalLink
          className="link"
          href="https://poap.zendesk.com/hc/en-us/articles/24008770288909-How-to-navigate-POAP-Family"
        >
          Here's how
        </ExternalLink>.
        <br />
        <ButtonLink onClick={handleDismiss}>dismiss</ButtonLink>
      </div>
    </div>
  )
}

export default Welcome
