import { COMPASS_KEY, COMPASS_URL } from '../models/compass'

export async function requestCompass(query, variables, abortSignal) {
  const response = await fetch(COMPASS_URL, {
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

  if (response.status !== 200) {
    let body
    try {
      body = await response.json()
    } catch (err) {}

    let message = 'Cannot request compass'
    if (
      body && 'errors' in body &&
      Array.isArray(body.errors) && body.errors.length > 0
    ) {
      message += `:${body.errors.reduce(
        (msg, error) => error && 'message' in error &&
          error.message && typeof error.message === 'string'
            ? `${msg} ${error.message}`
            : '',
        ''
      )}`
    }
    throw new Error(message)
  }

  const body = await response.json()

  if (
    !body || !('data' in body) ||
    !body.data || typeof body.data !== 'object'
  ) {
    throw new Error('Invalid compass response')
  }

  return body.data
}

export async function queryCompass(
  name,
  Model,
  query,
  variables,
  abortSignal
) {
  const results = await requestCompass(query, variables, abortSignal)

  if (!(name in results)) {
    throw new Error(`Missing model ${name} in compass response`)
  }

  return Model(results[name])
}

export async function queryFirstCompass(
  name,
  Model,
  query,
  variables,
  defaultValue,
  abortSignal
) {
  const FirstModel = (data) =>{
    if (data == null || !Array.isArray(data)) {
      throw new Error(`Model ${name} is not an array in compass response`)
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

export async function queryManyCompass(
  name,
  Model,
  query,
  variables,
  abortSignal
) {
  const ManyModel = (data) => {
    if (data == null || !Array.isArray(data)) {
      throw new Error(`Model ${name} is not an array in compass response`)
    }

    return data.map((result) => Model(result))
  }

  return await queryCompass(name, ManyModel, query, variables, abortSignal)
}

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
      if (typeof variables[offsetKey] !== 'number') {
        throw new Error(`Invalid offset on compass model ${name}: not a number`);
      }

      variables[offsetKey] = variables[offsetKey] + limit
    } else {
      variables[offsetKey] = 0
    }

    const pageResults = await queryManyCompass(name, Model, query, variables, abortSignal)

    results = [...results, ...pageResults]
    pageCount = pageResults.length
  } while (
    (total && pageCount >= total) || (!total && pageCount > 0)
  )

  return results
}

export async function queryAggregateCountCompass(
  name,
  query,
  variables,
  abortSignal
) {
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
      throw new Error(`Model ${name} is not an aggregate count in compass response`)
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
