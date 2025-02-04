export class HttpError extends Error {
  public status?: number

  constructor(message: string, options: ErrorOptions & { status?: number }) {
    super(message, options)
    if (options && options.status) {
      this.status = options.status
    }
  }
}

export class AbortedError extends Error {
  public aborted: boolean = true
}

export function filterAbortedErrors(
  errors: Record<number, Error>,
): Record<number, Error> {
  return Object.fromEntries(
    Object.entries(errors)
      .map(([rawDropId, error]) => [
        rawDropId,
        error instanceof AbortedError ? null : error
      ])
      .filter(([, errorOrNull]) => errorOrNull != null)
  )
}

export function getErrorCauseMessage(error: unknown): string | undefined {
  let causeMessage: string | undefined

  if (error instanceof Error && error.cause != null) {
    if (error.cause instanceof Error) {
      causeMessage = error.cause.message
    } else if (typeof error.cause === 'string') {
      causeMessage = error.cause
    }
  }

  return causeMessage
}
