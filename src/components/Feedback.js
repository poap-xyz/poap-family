import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { clsx } from 'clsx'
import { addFeedback } from 'loaders/api'
import { useSettings } from 'stores/settings'
import Button from 'components/Button'
import ButtonLink from 'components/ButtonLink'
import 'styles/feedback.css'

/**
 * @param {{ pathname: string; search: string; hash: string }} url
 * @returns {string}
 */
function getCurrentUrl(url) {
  return (
    `${url.pathname}` +
    `${url.search ? `${url.search}` : ''}` +
    `${url.hash ? `${url.hash}` : ''}`
  )
}

function Feedback() {
  const location = useLocation()
  const { set } = useSettings()
  /**
   * @type {ReturnType<typeof useState<boolean>>}
   */
  const [sent, setSent] = useState(false)
  /**
   * @type {ReturnType<typeof useState<string>>}
   */
  const [message, setMessage] = useState('')
  /**
   * @type {ReturnType<typeof useState<NodeJS.Timeout | null>>}
   */
  const [timeoutId, setTimeoutId] = useState(null)

  /**
   * @param {string} value
   */
  const handleOnMessageChange = (value) => {
    setMessage(value)
  }

  const handleSendFeedback = () => {
    setTimeoutId(setTimeout(
      () => {
        setSent(false)
        setTimeoutId(null)
      },
      3000
    ))
    addFeedback(message, getCurrentUrl(location))
    setSent(true)
    setMessage('')
  }

  const handleDismiss = () => {
    setSent(false)
    set('feedbackShown', true)
  }

  useEffect(
    () => () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    },
    [timeoutId]
  )

  return (
    <div className={clsx('feedback', sent && 'feedback-sent')}>
      <div className="feedback-content">
        <a className="feedback-ribbon">{/* eslint-disable-line jsx-a11y/anchor-is-valid */}
          Send your feedback
        </a>
        <div className="feedback-form">
          {sent
            ? <p className="feedback-thankyou">
                Thank you<br />for your<br />feedback.<br />
                <ButtonLink onClick={handleDismiss}>dismiss</ButtonLink>
              </p>
            : (
              <>
                <textarea
                  name="feedback"
                  value={message}
                  onChange={(event) => handleOnMessageChange(event.target.value)}
                  rows={5}
                  placeholder="What do you think?"
                ></textarea>
                <Button disabled={message.length < 10} onClick={handleSendFeedback}>
                  Send Feedback
                </Button>
              </>
            )
          }
        </div>
      </div>
    </div>
  )
}

export default Feedback
