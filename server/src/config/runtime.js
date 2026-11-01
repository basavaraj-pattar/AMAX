import { isAbsolute } from 'node:path'

const LOCAL_CLIENT_URL = 'http://localhost:5174'

function parseClientOrigins(value, production) {
  const configuredOrigins = (value || (production ? '' : LOCAL_CLIENT_URL))
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean)

  const origins = configuredOrigins.map(origin => {
    let url
    try {
      url = new URL(origin)
    } catch {
      throw new Error(`CLIENT_URL contains an invalid origin: ${origin}`)
    }

    if (!['http:', 'https:'].includes(url.protocol)
      || url.username
      || url.password
      || url.pathname !== '/'
      || url.search
      || url.hash) {
      throw new Error(`CLIENT_URL must contain only HTTP(S) origins: ${origin}`)
    }
    return url.origin
  })

  if (production && origins.length === 0) {
    throw new Error('CLIENT_URL must contain the deployed frontend origin in production.')
  }
  return [...new Set(origins)]
}

export function getRuntimeConfig(env = process.env) {
  const production = env.NODE_ENV === 'production'
  const port = Number(env.PORT || 5000)
  const mongoUri = typeof env.MONGO_URI === 'string' ? env.MONGO_URI.trim() : ''
  const storageDir = typeof env.STORAGE_DIR === 'string' ? env.STORAGE_DIR.trim() : ''
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535.')
  }

  if (production) {
    if (!mongoUri) throw new Error('MONGO_URI is required in production.')
    if (!/^mongodb(?:\+srv)?:\/\//i.test(mongoUri)) {
      throw new Error('MONGO_URI must be a MongoDB connection string in production.')
    }
    if (typeof env.JWT_SECRET !== 'string' || env.JWT_SECRET.trim().length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters in production.')
    }
    if (!storageDir || !isAbsolute(storageDir)) {
      throw new Error('STORAGE_DIR must be an absolute path on a persistent disk in production.')
    }
  }

  const clientOrigins = parseClientOrigins(env.CLIENT_URL, production)
  return {
    port,
    production,
    mongoUri,
    clientOrigins,
    clientAppUrl: clientOrigins[0] || LOCAL_CLIENT_URL
  }
}

export const runtimeConfig = getRuntimeConfig()
