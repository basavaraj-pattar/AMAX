import { Router } from 'express'

const TRAILER_QUERIES = [
  { q: 'Hollywood movie official trailer 2024 2025', type: 'HOLLYWOOD TRAILER' },
  { q: 'Bollywood new release Hindi movie official trailer 2024 2025', type: 'INDIAN NEW RELEASE' },
  { q: 'Kannada movie official trailer 2024 2025 sandalwood', type: 'KANNADA NEW RELEASE' },
]

export function youtubeSearchUrl(apiKey, query = 'official movie trailer 2026', maxResults = 10) {
  const parameters = new URLSearchParams({
    part: 'snippet',
    type: 'video',
    q: query,
    order: 'date',
    maxResults: String(maxResults),
    key: apiKey
  })
  return `https://www.googleapis.com/youtube/v3/search?${parameters}`
}

export async function fetchYoutubeTrailersForQuery(apiKey, query, type, request = fetch) {
  const response = await request(youtubeSearchUrl(apiKey, query, 5))
  if (!response.ok) throw new Error(`YouTube search failed (${response.status}).`)
  const data = await response.json()
  if (!Array.isArray(data.items)) throw new Error('YouTube returned an invalid trailer list.')
  return data.items.flatMap(item => {
    const videoId = item.id?.videoId
    const title = item.snippet?.title
    const poster =
      item.snippet?.thumbnails?.maxres?.url ||
      item.snippet?.thumbnails?.high?.url ||
      item.snippet?.thumbnails?.medium?.url ||
      item.snippet?.thumbnails?.default?.url
    if (typeof videoId !== 'string' || typeof title !== 'string' || typeof poster !== 'string') return []
    return [{
      videoId,
      watchUrl: `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`,
      type,
      title,
      poster,
      action: 'Watch now'
    }]
  })
}

export async function fetchYoutubeTrailers(apiKey, request = fetch, customQueries) {
  const queries = customQueries || (request !== fetch ? [{ q: 'official movie trailer 2026', type: 'FEATURED TRAILER' }] : TRAILER_QUERIES)
  const results = await Promise.allSettled(
    queries.map(({ q, type }) => fetchYoutubeTrailersForQuery(apiKey, q, type, request))
  )
  // Interleave results from all three categories for variety
  const buckets = results
    .filter(r => r.status === 'fulfilled')
    .map(r => r.value)
  const maxLen = Math.max(...buckets.map(b => b.length), 0)
  const interleaved = []
  for (let i = 0; i < maxLen; i++) {
    for (const bucket of buckets) {
      if (bucket[i]) interleaved.push(bucket[i])
    }
  }
  return interleaved
}

const router = Router()
let cachedTrailers = []
let cacheExpiresAt = 0
let pendingRequest

router.get('/', async (_req, res) => {
  if (!process.env.YOUTUBE_API_KEY) {
    return res.status(503).json({ message: 'Trailer search is not configured on the server.' })
  }
  if (Date.now() < cacheExpiresAt) return res.json(cachedTrailers)

  try {
    if (!pendingRequest) {
      pendingRequest = fetchYoutubeTrailers(process.env.YOUTUBE_API_KEY)
    }

    const trailers = await pendingRequest
    cachedTrailers = trailers
    cacheExpiresAt = Date.now() + 15 * 60 * 1000
    res.json(trailers)
  } catch (error) {
    console.error('Unable to fetch YouTube trailers:', error)
    res.status(502).json({ message: 'Unable to load trailers right now.' })
  } finally {
    pendingRequest = undefined
  }
})

export default router
