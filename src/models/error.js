export class HttpError extends Error {
  /**
   * 
   * @param {string} message
   * @param {ErrorOptions & { status?: number }} [options]
   */
  constructor(message, options) {
    super(message, options)
    if (options && options.status) {
      this.status = options.status
    }
  }
}

export class AbortedError extends Error {
  /**
   * 
   * @param {string} message
   * @param {ErrorOptions} [options]
   */
  constructor(message, options) {
    super(message, options)
    this.aborted = true
  }
}
