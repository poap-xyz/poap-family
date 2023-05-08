import { useContext } from 'react'
import { SettingsContext } from '../stores/cache'
import ButtonLink from './ButtonLink'
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
        <a className="link" href="https://poap.notion.site/POAP-Family-FAQ-cef29bc0bb8c4f8f936164d988a944cc" target="_blank" rel="noopener noreferrer">Here's how</a>.
        <br />
        <ButtonLink onClick={handleDismiss}>dismiss</ButtonLink>
      </div>
    </div>
  )
}

export default Welcome
