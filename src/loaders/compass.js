import { AbortedError, HttpError } from 'models/error'
import { COMPASS_KEY, COMPASS_URL } from 'models/compass'

/**
 * @param {string} query
 * @param {Record<string, unknown>} variables
 * @param {AbortSignal} [abortSignal]
 * @returns {Promise<object>}
 */
export async function requestCompass(query, variables, abortSignal) {
  /**
   * @type {Response}
   */
  let response
  try {
    response = await fetch(COMPASS_URL, {
      signal: abortSignal instanceof AbortSignal ? abortSignal : null,
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': COMPASS_KEY,
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    })
  } catch (err) {
    if (err.code === 20) {
      throw new AbortedError(
        `Request compass aborted`,
        { cause: err }
      )
    }
    throw new Error(
      `Cannot request compass: response was not success (network error)`,
      { cause: err }
    )
  }

  if (response.status !== 200) {
    /**
     * @type {unknown}
     */
    let body
    try {
      body = await response.json()
    } catch (err) {}

    let message = 'Cannot request compass'
    if (
      body != null &&
      typeof body === 'object' &&
      'errors' in body &&
      body.errors != null &&
      Array.isArray(body.errors) &&
      body.errors.length > 0
    ) {
      message += `:${body.errors.reduce(
        /**
         * @param {string} msg
         * @param {unknown} error
         * @returns {string}
         */
        (msg, error) => (
          error != null &&
          typeof error === 'object' &&
          'message' in error &&
          error.message != null &&
          typeof error.message === 'string'
            ? `${msg} ${error.message}`
            : ''
        ),
        ''
      )}`
    }

    throw new HttpError(message, { status: response.status })
  }

  const body = await response.json()

  if (
    body == null ||
    typeof body !== 'object' ||
    !('data' in body) ||
    body.data == null ||
    typeof body.data !== 'object'
  ) {
    let message = 'Invalid compass response'
    if (
      body != null &&
      typeof body === 'object' &&
      'errors' in body &&
      body.errors != null &&
      Array.isArray(body.errors) &&
      body.errors.length > 0
    ) {
      message += `:${body.errors.reduce(
        /**
         * @param {string} msg
         * @param {unknown} error
         * @returns {string}
         */
        (msg, error) => (
          error != null &&
          typeof error === 'object' &&
          'message' in error &&
          error.message != null &&
          typeof error.message === 'string'
            ? `${msg} ${error.message}`
            : ''
        ),
        ''
      )}`
    }
    throw new Error(message)
  }

  return body.data
}

/**
 * @template T
 * @param {string} name
 * @param {(data: unknown) => T} Model
 * @param {string} query
 * @param {Record<string, unknown>} variables
 * @param {AbortSignal} [abortSignal]
 * @returns {Promise<T>}
 */
export async function queryCompass(
  name,
  Model,
  query,
  variables,
  abortSignal
) {
  const results = await requestCompass(query, variables, abortSignal)

  if (
    results == null ||
    typeof results !== 'object' ||
    !(name in results) ||
    results[name] == null
  ) {
    throw new Error(`Missing model ${name} in compass response`)
  }

  return Model(results[name])
}

/**
 * @template T
 * @param {string} name
 * @param {(data: unknown) => T} Model
 * @param {string} query
 * @param {Record<string, unknown>} variables
 * @param {T} defaultValue
 * @param {AbortSignal} [abortSignal]
 * @returns {Promise<T>}
 */
export async function queryFirstCompass(
  name,
  Model,
  query,
  variables,
  defaultValue,
  abortSignal
) {
  /**
   * @param {unknown} data
   * @returns {T}
   */
  const FirstModel = (data) =>{
    if (data == null || !Array.isArray(data)) {
      throw new Error(
        `Model ${name} is not an array in compass response`
      )
    }

    if (data.length === 0) {
      return defaultValue
    }

    return Model(data[0])
  }

  return await queryCompass(
    name,
    FirstModel,
    query,
    variables,
    abortSignal
  )
}

/**
 * @template T
 * @param {string} name
 * @param {(data: unknown) => T} Model
 * @param {string} query
 * @param {Record<string, unknown>} variables
 * @param {AbortSignal} [abortSignal]
 * @returns {Promise<T[]>}
 */
export async function queryManyCompass(
  name,
  Model,
  query,
  variables,
  abortSignal
) {
  /**
   * @param {unknown} data
   * @returns {T[]}
   */
  const ManyModel = (data) => {
    if (data == null || !Array.isArray(data)) {
      throw new Error(
        `Model ${name} is not an array in compass response`
      )
    }

    return data.map((result) => Model(result))
  }

  return await queryCompass(name, ManyModel, query, variables, abortSignal)
}

/**
 * @template T
 * @param {string} name
 * @param {(data: unknown) => T} Model
 * @param {string} query
 * @param {Record<string, unknown>} variables
 * @param {string} offsetKey
 * @param {number} limit
 * @param {number} [total]
 * @param {AbortSignal} [abortSignal]
 * @returns {Promise<T[]>}
 */
export async function queryAllCompass(
  name,
  Model,
  query,
  variables,
  offsetKey,
  limit,
  total,
  abortSignal
) {
  let results = []
  let pageCount = 0

  do {
    if (offsetKey in variables) {
      const offset = variables[offsetKey]

      if (typeof offset !== 'number') {
        throw new Error(
          `Invalid offset on compass model ${name}: not a number`
        )
      }

      variables[offsetKey] = offset + limit
    } else {
      variables[offsetKey] = 0
    }

    const pageResults = await queryManyCompass(
      name,
      Model,
      query,
      variables,
      abortSignal
    )

    results = [...results, ...pageResults]
    pageCount = pageResults.length
  } while (
    (total && pageCount >= total) || (!total && pageCount > 0)
  )

  return results
}

/**
 * @param {string} name
 * @param {string} query
 * @param {Record<string, unknown>} variables
 * @param {AbortSignal} [abortSignal]
 * @returns {Promise<number>}
 */
export async function queryAggregateCountCompass(
  name,
  query,
  variables,
  abortSignal
) {
  /**
   * @param {unknown} data
   * @returns {number}
   */
  const AggregateCountModel = (data) => {
    if (
      data == null ||
      typeof data !== 'object' ||
      !('aggregate' in data) ||
      data.aggregate == null ||
      typeof data.aggregate !== 'object' ||
      !('count' in data.aggregate) ||
      data.aggregate.count == null ||
      typeof data.aggregate.count !== 'number'
    ) {
      throw new Error(
        `Model ${name} is not an aggregate count in compass response`
      )
    }
    return data.aggregate.count
  }

  return await queryCompass(
    name,
    AggregateCountModel,
    query,
    variables,
    abortSignal
  )
}

/**
 * @param {string} target
 * @param {AbortSignal} [abortSignal]
 * @returns {Promise<number>}
 */
export async function countCompass(target, abortSignal) {
  return await queryAggregateCountCompass(
    `${target}_aggregate`,
    `
      query Count {
        ${target}_aggregate {
          aggregate {
            count
          }
        }
      }
    `,
    {},
    abortSignal
  )
}
