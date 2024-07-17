import { ReactNode } from 'react'
import { QuestionMark } from 'iconoir-react'
import { useSettings } from 'stores/settings'
import CornerBackground from 'assets/images/Corner_Background.svg'
import Feedback from 'components/Feedback'
import LogoMenu from 'components/LogoMenu'
import MenuItem from 'components/MenuItem'
import 'styles/page.css'

function Page({
  children,
  showCorner = true,
}: {
  children: ReactNode
  showCorner?: boolean
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

export default Page
