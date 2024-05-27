import PropTypes from 'prop-types'
import { QuestionMark } from 'iconoir-react'
import { useSettings } from 'stores/settings'
import CornerBackground from 'images/Corner_Background.svg'
import Feedback from 'components/Feedback'
import LogoMenu from 'components/LogoMenu'
import MenuItem from 'components/MenuItem'
import 'styles/page.css'

/**
 * @param {PropTypes.InferProps<Page.propTypes>} props
 */
function Page({
  children,
  showCorner = true,
}) {
  const { settings } = useSettings()

  return (
    <div className="page">
      <div className="page-aside">
        <LogoMenu>
          <MenuItem
            label="?"
            icon={<QuestionMark />}
            title="Help"
            href="https://poap.zendesk.com/hc/en-us/articles/24008770288909-How-to-navigate-POAP-Family"
            external={true}
          />
        </LogoMenu>
        {!settings.feedbackShown && <Feedback />}
      </div>
      <div className="page-content">
        {children}
        {showCorner && (
          <div className="corner-bg">
            <img src={CornerBackground} alt="" />
          </div>
        )}
      </div>
    </div>
  )
}

Page.propTypes = {
  children: PropTypes.node.isRequired,
  showCorner: PropTypes.bool,
}

export default Page
