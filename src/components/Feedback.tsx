import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { clsx } from 'clsx'
import { addFeedback } from 'services/api'
import { useSettings } from 'stores/settings'
import Button from 'components/Button'
import ButtonLink from 'components/ButtonLink'
import 'styles/feedback.css'

function getCurrentUrl(url: { pathname: string; search: string; hash: string }): string {
  return (
    `${url.pathname}` +
    `${url.search ? `${url.search}` : ''}` +
    `${url.hash ? `${url.hash}` : ''}`
  )
}

function Feedback() {
  const location = useLocation()
  const { setSetting } = useSettings()
  const [sent, setSent] = useState<boolean>(false)
  const [message, setMessage] = useState<string>('')
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null)

  function handleOnMessageChange(value: string): void {
    setMessage(value)
  }

  function handleSendFeedback(): void {
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

  function handleDismiss(): void {
    setSent(false)
    setSetting('feedbackShown', true)
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
