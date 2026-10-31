const SEARCH_URL = 'https://www.googleapis.com/youtube/v3/search'
const VIDEOS_URL = 'https://www.googleapis.com/youtube/v3/videos'
const QUERY_TIMEOUT_MS = 12_000
const MAX_FEATURED_TRAILERS = 3

// YouTube's search API does not identify studio-owned channels reliably, so
// only use known distributors/studios by default. More trusted regional
// channel names can be added with SHOWCASE_OFFICIAL_CHANNELS (pipe-separated).
const OFFICIAL_CHANNEL_NAMES = [
  'T-Series', 'Yash Raj Films', 'YRF', 'Dharma Productions', 'Zee Studios', 'Zee Music Company',
  'Sony Pictures', 'Jio Studios', 'Maddock Films', 'Excel Entertainment', 'Red Chillies Entertainment',
  'Hombale Films', 'Mythri Movie Makers', 'Sri Venkateswara Creations', 'Geetha Arts', 'Sun Pictures',
  'Lyca Productions', '2D Entertainment', 'Dream Warrior Pictures', 'AA Films', 'Panorama Studios',
  'Eros International', 'Eros Now', 'Goldmines', 'Saregama Music', 'Think Music India', 'Divo Music',
  'KRG Studios', 'People Media Factory', 'Sithara Entertainments', 'Vyjayanthi Movies', 'Aditya Music',
  'Lahari Music', 'Paramvah Studios', 'Annapurna Studios', 'Suresh Productions', 'Arka Media Works',
  'Warner Bros. Pictures', 'Warner Bros. Entertainment', 'Universal Pictures', 'Sony Pictures Entertainment',
  'Paramount Pictures', 'Lionsgate Movies', '20th Century Studios', 'Marvel Entertainment',
  'A24', 'NEON', 'Focus Features', 'Searchlight Pictures', 'Netflix', 'Prime Video', 'Apple TV', 'Disney',
  'Toho', 'Godzilla Official', 'Shochiku', 'GKIDS Films', 'Crunchyroll', 'Aniplex', 'Bandai Namco Filmworks'
]
const TRAILER_TITLE_PATTERN = /\btrailer\b|ट्रेलर|ট্রেলার|ટ્રેલર|ਟ੍ਰੇਲਰ|ଟ୍ରେଲର|டிரெய்லர்|ட்ரெய்லர்|ట్రైలర్|ಟ್ರೈಲರ್|ട്രെയിലർ|予告編|예고편|bande[ -]annonce|tráiler/i
const EXCLUDED_TITLE_PATTERN = /\b(reaction|reacts?|review|explained|breakdown|commentary|recap|fan[- ]?made|parody|shorts?|full movie|music video|teaser|first glimpse|movie update|news)\b/i
const EXCLUDED_CHANNEL_PATTERN = /\b(reaction|reviews?|explainer|recap|breakdown|commentary|analysis|predictions?|movie updates?|film news|fans?)\b/i

function normalizeChannelName(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function channelContainsName(channel, name) {
  const normalizedChannel = ` ${normalizeChannelName(channel)} `
  const normalizedName = ` ${normalizeChannelName(name)} `
  return normalizedName.trim().length > 0 && normalizedChannel.includes(normalizedName)
}

export function isOfficialTrailerCandidate(item) {
  if (!item || typeof item.title !== 'string' || typeof item.channelTitle !== 'string') return false
  if (!TRAILER_TITLE_PATTERN.test(item.title) || EXCLUDED_TITLE_PATTERN.test(item.title)) return false
  if (EXCLUDED_CHANNEL_PATTERN.test(item.channelTitle)) return false

  const configuredNames = (process.env.SHOWCASE_OFFICIAL_CHANNELS || '').split('|').map(value => value.trim()).filter(Boolean)
  return [...OFFICIAL_CHANNEL_NAMES, ...configuredNames].some(name => channelContainsName(item.channelTitle, name))
}

export const weeklyTrailerSearches = [
  { language: 'Assamese', languageCode: 'as', regionCode: 'IN', q: 'Assamese film official trailer new release' },
  { language: 'Bengali', languageCode: 'bn', regionCode: 'IN', q: 'Bengali film official trailer new release' },
  { language: 'Bodo', regionCode: 'IN', q: 'Bodo film official trailer new release' },
  { language: 'Dogri', regionCode: 'IN', q: 'Dogri film official trailer new release' },
  { language: 'Gujarati', languageCode: 'gu', regionCode: 'IN', q: 'Gujarati film official trailer new release' },
  { language: 'Hindi', languageCode: 'hi', regionCode: 'IN', q: 'Hindi film official trailer new release' },
  { language: 'Kannada', languageCode: 'kn', regionCode: 'IN', q: 'Kannada film official trailer new release' },
  { language: 'Kashmiri', regionCode: 'IN', q: 'Kashmiri film official trailer new release' },
  { language: 'Konkani', regionCode: 'IN', q: 'Konkani film official trailer new release' },
  { language: 'Maithili', regionCode: 'IN', q: 'Maithili film official trailer new release' },
  { language: 'Malayalam', languageCode: 'ml', regionCode: 'IN', q: 'Malayalam film official trailer new release' },
  { language: 'Manipuri', regionCode: 'IN', q: 'Manipuri film official trailer new release' },
  { language: 'Marathi', languageCode: 'mr', regionCode: 'IN', q: 'Marathi film official trailer new release' },
  { language: 'Nepali', languageCode: 'ne', regionCode: 'IN', q: 'Nepali film official trailer new release' },
  { language: 'Odia', languageCode: 'or', regionCode: 'IN', q: 'Odia film official trailer new release' },
  { language: 'Punjabi', languageCode: 'pa', regionCode: 'IN', q: 'Punjabi film official trailer new release' },
  { language: 'Sanskrit', regionCode: 'IN', q: 'Sanskrit film official trailer new release' },
  { language: 'Santali', regionCode: 'IN', q: 'Santali film official trailer new release' },
  { language: 'Sindhi', regionCode: 'IN', q: 'Sindhi film official trailer new release' },
  { language: 'Tamil', languageCode: 'ta', regionCode: 'IN', q: 'Tamil film official trailer new release' },
  { language: 'Telugu', languageCode: 'te', regionCode: 'IN', q: 'Telugu film official trailer new release' },
  { language: 'Urdu', languageCode: 'ur', regionCode: 'IN', q: 'Urdu film official trailer new release' },
  { language: 'Hollywood', languageCode: 'en', regionCode: 'US', q: 'Hollywood official movie trailer new release' },
  { language: 'Underrated world cinema', languageCode: 'en', regionCode: 'GB', q: 'underrated independent world cinema official trailer new release' },
  { language: 'Japanese', languageCode: 'ja', regionCode: 'JP', q: 'Japanese movie official trailer new release' },
  { language: 'Korean', languageCode: 'ko', regionCode: 'KR', q: 'Korean movie official trailer new release' },
  { language: 'French', languageCode: 'fr', regionCode: 'FR', q: 'French movie official trailer new release' },
  { language: 'Spanish', languageCode: 'es', regionCode: 'ES', q: 'Spanish movie official trailer new release' }
]

function requestUrl(base, parameters) {
  const url = new URL(base)
  for (const [key, value] of Object.entries(parameters)) {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value))
  }
  return url.toString()
}

async function getJson(url, request) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), QUERY_TIMEOUT_MS)
  try {
    const response = await request(url, { signal: controller.signal })
    if (!response.ok) {
      let detail = ''
      try {
        const payload = await response.json()
        const reason = payload.error?.errors?.[0]?.reason || payload.error?.status || ''
        const message = typeof payload.error?.message === 'string' ? payload.error.message : ''
        detail = [reason, message].filter(Boolean).join(': ')
      } catch {}
      throw new Error(`YouTube API returned ${response.status}${detail ? ` (${detail})` : ''}.`.slice(0, 360))
    }
    return await response.json()
  } finally {
    clearTimeout(timer)
  }
}

async function mapWithConcurrency(values, concurrency, callback) {
  const results = new Array(values.length)
  let nextIndex = 0
  await Promise.all(Array.from({ length: Math.min(concurrency, values.length) }, async () => {
    while (nextIndex < values.length) {
      const index = nextIndex++
      try { results[index] = { status: 'fulfilled', value: await callback(values[index], index) } }
      catch (reason) { results[index] = { status: 'rejected', reason } }
    }
  }))
  return results
}

function mapSearchItem(item, search) {
  const videoId = item.id?.videoId
  const snippet = item.snippet || {}
  const posterUrl = snippet.thumbnails?.maxres?.url
    || snippet.thumbnails?.high?.url
    || snippet.thumbnails?.medium?.url
    || snippet.thumbnails?.default?.url
  if (typeof videoId !== 'string' || !videoId || typeof snippet.title !== 'string' || typeof posterUrl !== 'string') return null
  const published = snippet.publishedAt ? new Date(snippet.publishedAt) : null
  return {
    videoId,
    title: snippet.title.slice(0, 300),
    description: typeof snippet.description === 'string' ? snippet.description.slice(0, 1200) : '',
    posterUrl,
    watchUrl: `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`,
    channelTitle: typeof snippet.channelTitle === 'string' ? snippet.channelTitle.slice(0, 180) : '',
    language: search.language,
    regionCode: search.regionCode,
    category: search.language.toUpperCase(),
    viewCount: 0,
    publishedAt: published && Number.isFinite(published.getTime()) ? published : null
  }
}

async function fetchVideoViews(apiKey, videoIds, request) {
  const statistics = new Map()
  for (let index = 0; index < videoIds.length; index += 50) {
    const ids = videoIds.slice(index, index + 50)
    const url = requestUrl(VIDEOS_URL, { part: 'statistics', id: ids.join(','), key: apiKey })
    const payload = await getJson(url, request)
    for (const video of payload.items || []) {
      const views = Number(video.statistics?.viewCount)
      statistics.set(video.id, Number.isFinite(views) ? views : 0)
    }
  }
  return statistics
}

export async function fetchWeeklyYoutubeShowcase(apiKey, {
  now = new Date(),
  lookbackDays = Number.parseInt(process.env.SHOWCASE_TRAILER_LOOKBACK_DAYS, 10) || 45,
  limit = Number.parseInt(process.env.SHOWCASE_TRAILER_LIMIT, 10) || MAX_FEATURED_TRAILERS,
  request = fetch
} = {}) {
  if (!apiKey) return { configured: false, searchCount: 0, trailers: [] }

  const publishedAfter = new Date(now.getTime() - Math.max(7, Math.min(lookbackDays, 90)) * 24 * 60 * 60 * 1000).toISOString()
  const searchResults = await mapWithConcurrency(weeklyTrailerSearches, 10, async search => {
    const url = requestUrl(SEARCH_URL, {
      part: 'snippet',
      type: 'video',
      order: 'date',
      maxResults: 3,
      q: search.q,
      publishedAfter,
      regionCode: search.regionCode,
      relevanceLanguage: search.languageCode,
      safeSearch: 'moderate',
      videoEmbeddable: 'true',
      key: apiKey
    })
    const payload = await getJson(url, request)
    if (!Array.isArray(payload.items)) throw new Error('YouTube returned an invalid search result.')
    return payload.items.map(item => mapSearchItem(item, search)).filter(isOfficialTrailerCandidate)
  })

  const failedSearches = searchResults.filter(result => result.status === 'rejected').length
  const searchCandidates = searchResults.flatMap(result => result.status === 'fulfilled' ? result.value : [])
  const deduplicated = new Map()
  for (const candidate of searchCandidates) {
    const current = deduplicated.get(candidate.videoId)
    if (!current || candidate.publishedAt > current.publishedAt) deduplicated.set(candidate.videoId, candidate)
  }
  const candidates = [...deduplicated.values()]
  let viewCounts = new Map()
  try {
    viewCounts = await fetchVideoViews(apiKey, candidates.map(item => item.videoId), request)
  } catch {
    // Search results remain usable when YouTube's optional popularity lookup is unavailable.
  }

  const topPerCategory = new Map()
  for (const candidate of candidates) {
    candidate.viewCount = viewCounts.get(candidate.videoId) || 0
    const current = topPerCategory.get(candidate.category)
    if (!current || candidate.viewCount > current.viewCount
      || (candidate.viewCount === current.viewCount && candidate.publishedAt > current.publishedAt)) {
      topPerCategory.set(candidate.category, candidate)
    }
  }

  const trailers = [...topPerCategory.values()]
    .sort((left, right) => right.viewCount - left.viewCount
      || (right.publishedAt?.getTime() || 0) - (left.publishedAt?.getTime() || 0))
    .slice(0, Math.max(1, Math.min(limit, MAX_FEATURED_TRAILERS)))

  const failedSearch = searchResults.find(result => result.status === 'rejected')
  const error = failedSearch?.reason instanceof Error ? failedSearch.reason.message.slice(0, 360) : ''
  return {
    configured: true,
    searchCount: weeklyTrailerSearches.length - failedSearches,
    failedSearches,
    error,
    trailers
  }
}
