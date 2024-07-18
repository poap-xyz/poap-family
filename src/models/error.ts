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
