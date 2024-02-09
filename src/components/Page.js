import { useContext } from 'react'
import { SettingsContext } from '../stores/cache'
import CornerBackground from '../images/Corner_Background.svg'
import Feedback from './Feedback'
import LogoMenu from './LogoMenu'
import MenuItem from './MenuItem'
import { QuestionMark } from 'iconoir-react'
import '../styles/page.css'

function Page({ children, showCorner = true }) {
  const { settings } = useContext(SettingsContext)

  return (
    <div className="page">
      <div className="page-aside">
        <LogoMenu>
          <MenuItem
            label="?"
            icon={<QuestionMark />}
            title="Help"
            href="https://poap.zendesk.com/hc/en-us/articles/24008770288909-How-to-navigate-POAP-Family"
            target="_blank"
            rel="noopener noreferrer"
          />
        </LogoMenu>
        {settings && !settings.feedbackShown && <Feedback />}
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

export default Page
