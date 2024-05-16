import PropTypes from 'prop-types'
import { useContext } from 'react'
import { SettingsContext } from '../stores/cache'
import ButtonLink from './ButtonLink'
import ExternalLink from './ExternalLink'
import '../styles/welcome.css'

/**
 * @param {PropTypes.InferProps<Welcome.propTypes>} props
 */
function Welcome({ showHelp = true }) {
  const { set } = useContext(SettingsContext)

  const handleDismiss = () => {
    set('welcomeShown', true)
  }

  return (
    <div className="welcome">
      <div className="welcome-content">
        Explore POAPs collections have in common.
        {showHelp && (
          <>
            {' '}
            <ExternalLink
              className="link"
              href="https://poap.zendesk.com/hc/en-us/articles/24008770288909-How-to-navigate-POAP-Family"
            >
              Here's how
            </ExternalLink>.
          </>
        )}
        <br />
        <ButtonLink onClick={handleDismiss}>dismiss</ButtonLink>
      </div>
    </div>
  )
}

Welcome.propTypes = {
  showHelp: PropTypes.bool,
}

export default Welcome
