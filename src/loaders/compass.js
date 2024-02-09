import { COMPASS_KEY, COMPASS_URL } from '../models/compass'

async function queryCompass(name, models, query, variables, offlimits, abortSignal) {
  const results = {}
  let numResults

  do {
    numResults = 0

    if (offlimits) {
      for (const [offsetKey, limit] of Object.entries(offlimits)) {
        if (!limit) {
          continue
        }
        if (offsetKey in variables) {
          variables[offsetKey] += limit
        } else {
          variables[offsetKey] = 0
        }
      }
    }

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
      let message = `Cannot ${name}`
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
      throw new Error(`Invalid ${name} response`)
    }

    for (const [modelName, Model] of Object.entries(models)) {
      if (!Model) {
        continue
      }
      if (!(modelName in body.data)) {
        throw new Error(`Missing ${name} model ${modelName} in response`)
      }
      try {
        const nextResult = Model(body.data[modelName])
        if (Array.isArray(nextResult)) {
          numResults += nextResult.length
          if (modelName in results) {
            results[modelName].push(...nextResult)
          } else {
            results[modelName] = nextResult
          }
        } else if (nextResult != null) {
          numResults++
          if (modelName in results) {
            if (Array.isArray(results[modelName])) {
              results[modelName].push(nextResult)
            } else if (typeof results[modelName] === 'number') {
              results[modelName] += nextResult
            } else if (results[modelName] != null) {
              results[modelName] = [results[modelName], nextResult]
            } else {
              results[modelName] = nextResult
            }
          } else {
            results[modelName] = nextResult
          }
        }
      } catch (err) {
        throw new Error(`Invalid ${name} model ${modelName}: ${err}`)
      }
    }
  } while (numResults > 0 && offlimits)

  return results
}

export {
  queryCompass,
}
