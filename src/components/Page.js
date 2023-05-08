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
          <MenuItem label="?" title="FAQ" icon={<QuestionMark />} href="https://poap.notion.site/POAP-Family-FAQ-cef29bc0bb8c4f8f936164d988a944cc" />
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
