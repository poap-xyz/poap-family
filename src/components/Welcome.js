import PropTypes from 'prop-types'
import { useSettings } from 'stores/settings'
import ButtonLink from 'components/ButtonLink'
import ExternalLink from 'components/ExternalLink'
import 'styles/welcome.css'

/**
 * @param {PropTypes.InferProps<Welcome.propTypes>} props
 */
function Welcome({ showHelp = true }) {
  const { setSetting } = useSettings()

  const handleDismiss = () => {
    setSetting('welcomeShown', true)
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
