import { useContext, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { clsx } from 'clsx'
import { addFeedback } from '../loaders/api'
import { SettingsContext } from '../stores/cache'
import Button from './Button'
import ButtonLink from './ButtonLink'
import '../styles/feedback.css'

function getCurrentUrl(url) {
  return `${url.pathname}${url.search ? `${url.search}` : ''}${url.hash ? `${url.hash}` : ''}`
}

function Feedback() {
  const { set } = useContext(SettingsContext)
  const [sent, setSent] = useState(false)
  const [message, setMessage] = useState('')
  const [timeoutId, setTimeoutId] = useState(null)
  const location = useLocation()

  const handleOnMessageChange = (event) => {
    setMessage(event.target.value)
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
                  onChange={handleOnMessageChange}
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
