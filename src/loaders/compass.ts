import { AbortedError, HttpError } from 'models/error'
import { COMPASS_KEY, COMPASS_URL } from 'models/compass'

export async function requestCompass(
  query: string,
  variables: Record<string, unknown>,
  abortSignal?: AbortSignal,
): Promise<object> {
  let response: Response
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
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
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
    let body: unknown
    try {
      body = await response.json()
    } catch (err: unknown) {}

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
        (msg: string, error: unknown): string => (
          error != null &&
          typeof error === 'object' &&
          'message' in error &&
          error.message != null &&
          typeof error.message === 'string'
            ? `${msg} ${error.message}`
            : `${msg}`
        ),
        ''
      )}`
    }

    throw new HttpError(message, { status: response.status })
  }

  const body: unknown = await response.json()

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
        (msg: string, error: unknown): string => (
          error != null &&
          typeof error === 'object' &&
          'message' in error &&
          error.message != null &&
          typeof error.message === 'string'
            ? `${msg} ${error.message}`
            : `${msg}`
        ),
        ''
      )}`
    }
    throw new Error(message)
  }

  return body.data
}

export async function queryCompass<T>(
  name: string,
  Model: (data: unknown) => T,
  query: string,
  variables: Record<string, unknown>,
  abortSignal?: AbortSignal
): Promise<T> {
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

export async function queryFirstCompass<T>(
  name: string,
  Model: (data: unknown) => T,
  query: string,
  variables: Record<string, unknown>,
  defaultValue: T,
  abortSignal?: AbortSignal
): Promise<T> {
  const FirstModel = (data: unknown): T =>{
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

export async function queryManyCompass<T>(
  name: string,
  Model: (data: unknown) => T,
  query: string,
  variables: Record<string, unknown>,
  abortSignal?: AbortSignal
): Promise<T[]> {
  const ManyModel = (data: unknown): T[] => {
    if (data == null || !Array.isArray(data)) {
      throw new Error(
        `Model ${name} is not an array in compass response`
      )
    }

    return data.map((result) => Model(result))
  }

  return await queryCompass(name, ManyModel, query, variables, abortSignal)
}

export async function queryAllCompass<T>(
  name: string,
  Model: (data: unknown) => T,
  query: string,
  variables: Record<string, unknown>,
  offsetKey: string,
  limit: number,
  total: number,
  abortSignal?: AbortSignal
): Promise<T[]> {
  let results: T[] = []
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

export async function queryAggregateCountCompass(
  name: string,
  query: string,
  variables: Record<string, unknown>,
  abortSignal?: AbortSignal
): Promise<number> {
  const AggregateCountModel = (data: unknown): number => {
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

export async function countCompass(
  target: string,
  abortSignal?: AbortSignal,
): Promise<number> {
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
