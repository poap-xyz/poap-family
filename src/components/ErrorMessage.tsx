import { ReactNode, useState } from 'react'
import { NavArrowDown, NavArrowRight } from 'iconoir-react'
import { clsx } from 'clsx'
import 'styles/error-message.css'

const STATUS_TEXT = {
  400: 'Bad Request',
  404: 'Not Found',
  503: 'Unavailable',
}

function ErrorMessage({
  error,
  title: errorTitle,
  message,
  children,
  small = false,
  away = false,
}: {
  error?: unknown
  title?: ReactNode
  message?: string
  children?: ReactNode
  small?: boolean
  away?: boolean
}) {
  const [casueOpen, setCauseOpen] = useState<boolean>(false)

  let causeMessage: string | undefined
  if (error instanceof Error && error.cause != null) {
    if (error.cause instanceof Error) {
      causeMessage = error.cause.message
    } else if (typeof error.cause === 'string') {
      causeMessage = error.cause
    }
  }

  const errorStatus = (
    error != null &&
    typeof error === 'object' &&
    'status' in error &&
    error.status != null &&
    typeof error.status === 'number'
  )
    ? error.status
    : undefined
  const errorStatusText = (
    error != null &&
    typeof error === 'object' &&
    'statusText' in error &&
    error.statusText != null &&
    typeof error.statusText === 'string'
  )
    ? error.statusText
    : undefined

  return (
    <div className={clsx('error-message', { small, away })}>
      {errorTitle && (
        <h5>{errorTitle}</h5>
      )}
      {(STATUS_TEXT[errorStatus] || errorStatusText) && (
        <p className="message">
          {STATUS_TEXT[errorStatus] && (
            <>
              <b>{STATUS_TEXT[errorStatus]}</b>
              {errorStatusText && ' '}
            </>
          )}
          {errorStatusText}
        </p>
      )}
      {(
        error != null &&
        typeof error === 'object' &&
        'message' in error &&
        error.message != null &&
        typeof error.message === 'string'
      ) && (
        <div className="error">
          <div className="message">
            <p>{error.message}</p>
            {causeMessage && casueOpen && (
              <p>{causeMessage}</p>
            )}
          </div>
          {causeMessage && (
            <div className="actions">
              <button
                className={clsx('cause-button', { open: casueOpen })}
                onClick={() => setCauseOpen((prev) => !prev)}
              >
                {casueOpen ? <NavArrowDown /> : <NavArrowRight />}
              </button>
            </div>
          )}
        </div>
      )}
      {message && (
        <p className="message">{message}</p>
      )}
      {typeof children === 'string'
        ? <p className="message">{children}</p>
        : children}
    </div>
  )
}

export default ErrorMessage
