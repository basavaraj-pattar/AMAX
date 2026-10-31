import mongoose from 'mongoose'
import Content from '../models/Content.js'
import ShowcaseEvent from '../models/ShowcaseEvent.js'
import WeeklyShowcase from '../models/WeeklyShowcase.js'
import User from '../models/User.js'
import { fetchWeeklyYoutubeShowcase, isOfficialTrailerCandidate } from './youtubeShowcase.js'

const inFlightRefreshes = new Map()

export function getIsoWeekWindow(now = new Date()) {
  const indiaOffsetMs = 330 * 60 * 1000
  const indiaLocal = new Date(now.getTime() + indiaOffsetMs)
  const mondayLocal = new Date(Date.UTC(indiaLocal.getUTCFullYear(), indiaLocal.getUTCMonth(), indiaLocal.getUTCDate()))
  const weekday = mondayLocal.getUTCDay() || 7
  mondayLocal.setUTCDate(mondayLocal.getUTCDate() - weekday + 1)
  const weekKey = mondayLocal.toISOString().slice(0, 10)
  const startsAt = new Date(mondayLocal.getTime() - indiaOffsetMs)
  const endsAt = new Date(startsAt.getTime() + 7 * 24 * 60 * 60 * 1000)
  return { weekKey, startsAt, endsAt }
}

function shortFilmPipeline(match) {
  return [
    { $match: match },
    { $addFields: { likeCount: { $size: { $ifNull: ['$likes', []] } } } },
    { $sort: { likeCount: -1, createdAt: -1, _id: 1 } },
    { $limit: 2 },
    { $lookup: { from: User.collection.name, localField: 'creator', foreignField: '_id', as: 'creatorDetails' } },
    { $unwind: { path: '$creatorDetails', preserveNullAndEmptyArrays: true } },
    { $project: {
      contentId: '$_id', title: 1, description: 1, posterUrl: 1, mediaUrl: 1, likeCount: 1, createdAt: 1,
      creator: { name: '$creatorDetails.name', username: '$creatorDetails.username', avatarUrl: '$creatorDetails.avatarUrl' }
    } }
  ]
}

async function findTopShortFilms(startsAt, endsAt) {
  const eligibleShortFilm = {
      type: 'film',
      category: { $regex: '^short[- ]film$', $options: 'i' },
      moderationStatus: 'published',
      showcaseApproved: true
  }
  const thisWeek = await Content.aggregate(shortFilmPipeline({
    ...eligibleShortFilm,
    createdAt: { $gte: startsAt, $lt: endsAt }
  }))

  // Keep the weekly slot populated when there are no newly approved shorts this week.
  // Older approved films remain eligible as a fallback and are still ranked by likes.
  if (thisWeek.length) return thisWeek
  return Content.aggregate(shortFilmPipeline(eligibleShortFilm))
}

async function findTopScriptsAndStories(startsAt, endsAt) {
  return Content.aggregate([
    { $match: {
      type: { $in: ['script', 'story'] },
      moderationStatus: 'published',
      createdAt: { $gte: startsAt, $lt: endsAt }
    } },
    { $addFields: {
      viewCount: { $ifNull: ['$views', 0] },
      likeCount: { $size: { $ifNull: ['$likes', []] } }
    } },
    { $sort: { viewCount: -1, likeCount: -1, createdAt: -1, _id: 1 } },
    { $limit: 5 },
    { $lookup: { from: User.collection.name, localField: 'creator', foreignField: '_id', as: 'creatorDetails' } },
    { $unwind: { path: '$creatorDetails', preserveNullAndEmptyArrays: true } },
    { $project: {
      contentId: '$_id', type: 1, title: 1, description: 1, posterUrl: 1, viewCount: 1, likeCount: 1, createdAt: 1,
      creator: { name: '$creatorDetails.name', username: '$creatorDetails.username', avatarUrl: '$creatorDetails.avatarUrl' }
    } }
  ])
}

async function createWeeklySnapshot(window) {
  const youtube = await fetchWeeklyYoutubeShowcase(process.env.YOUTUBE_API_KEY).catch(error => {
    console.error('Weekly YouTube showcase refresh failed:', error.message)
    return { configured: Boolean(process.env.YOUTUBE_API_KEY), searchCount: 0, failedSearches: 0, error: error.message.slice(0, 360), trailers: [] }
  })

  const update = {
    ...window,
    generatedAt: new Date(),
    youtubeConfigured: youtube.configured,
    youtubeSearchCount: youtube.searchCount,
    youtubeFailedSearches: youtube.failedSearches || 0,
    youtubeError: youtube.error || '',
    trailers: youtube.trailers
  }

  return WeeklyShowcase.findOneAndUpdate(
    { weekKey: window.weekKey },
    { $set: update },
    { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
  ).lean()
}

export async function getWeeklySnapshot({ now = new Date(), force = false } = {}) {
  if (mongoose.connection.readyState !== 1) {
    throw Object.assign(new Error('Weekly showcase data is not available until MongoDB is connected.'), { status: 503 })
  }

  const window = getIsoWeekWindow(now)
  if (!force) {
    const cached = await WeeklyShowcase.findOne({ weekKey: window.weekKey }).lean()
    if (cached) return cached
  }
  if (inFlightRefreshes.has(window.weekKey)) return inFlightRefreshes.get(window.weekKey)

  const refresh = createWeeklySnapshot(window)
  inFlightRefreshes.set(window.weekKey, refresh)
  try { return await refresh }
  finally { inFlightRefreshes.delete(window.weekKey) }
}

function formatEventDetail(event) {
  const parts = []
  if (event.region) parts.push(event.region.toUpperCase())
  if (event.submissionDeadline) {
    parts.push(`APPLY BY ${new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(event.submissionDeadline).toUpperCase()}`)
  } else if (event.startAt) {
    parts.push(`STARTS ${new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(event.startAt).toUpperCase()}`)
  }
  return parts.join(' · ')
}

function mapShortFilm(item) {
  const contentId = String(item.contentId)
  return {
    kind: 'short-film',
    type: 'MOST LIKED SHORT FILM THIS WEEK',
    title: item.title,
    detail: `${item.likeCount} ${item.likeCount === 1 ? 'like' : 'likes'} · ${item.creator.name}`,
    poster: item.posterUrl,
    posterUrl: item.posterUrl,
    contentId,
    creator: item.creator,
    likeCount: item.likeCount,
    action: 'Watch now',
    actionUrl: `/?film=${encodeURIComponent(contentId)}`
  }
}

function mapTrailer(item) {
  return {
    kind: 'youtube-trailer',
    type: `${item.language.toUpperCase()} · NEW RELEASE TRAILER`,
    title: item.title,
    detail: `${item.viewCount.toLocaleString('en')} YouTube views${item.channelTitle ? ` · ${item.channelTitle}` : ''}`,
    poster: item.posterUrl,
    posterUrl: item.posterUrl,
    videoId: item.videoId,
    watchUrl: item.watchUrl,
    publishedAt: item.publishedAt,
    language: item.language,
    viewCount: item.viewCount,
    action: 'Watch trailer',
    actionUrl: item.watchUrl
  }
}

function mapScript(item) {
  const contentId = String(item.contentId)
  const type = item.type === 'story' ? 'MOST VIEWED STORY THIS WEEK' : 'MOST VIEWED SCRIPT THIS WEEK'
  return {
    kind: 'script-story',
    type,
    title: item.title,
    detail: `${item.viewCount.toLocaleString('en')} reads · ${item.creator.name}`,
    poster: item.posterUrl,
    posterUrl: item.posterUrl,
    contentId,
    contentType: item.type,
    creator: item.creator,
    viewCount: item.viewCount,
    action: 'Read now',
    actionUrl: `/?script=${encodeURIComponent(contentId)}`
  }
}

function mapEvent(event) {
  const type = event.eventType === 'festival' ? 'UPCOMING FILM FESTIVAL'
    : event.eventType === 'competition' ? 'FILM COMPETITION'
      : event.eventType === 'grant' ? 'FILMMAKER GRANT' : 'INDUSTRY EVENT'
  const detail = [event.summary, formatEventDetail(event)].filter(Boolean).join(' · ')
  return {
    kind: 'festival',
    type,
    title: event.title,
    detail,
    poster: event.posterUrl,
    posterUrl: event.posterUrl,
    region: event.region,
    startAt: event.startAt,
    submissionDeadline: event.submissionDeadline,
    applicationUrl: event.applicationUrl,
    eventUrl: event.eventUrl,
    action: 'Apply now',
    actionUrl: event.applicationUrl
  }
}

export async function getPublicShowcase(options = {}) {
  const snapshot = await getWeeklySnapshot(options)
  const now = options.now || new Date()
  const [shortFilmRecords, scriptRecords, events] = await Promise.all([
    findTopShortFilms(snapshot.startsAt, snapshot.endsAt),
    findTopScriptsAndStories(snapshot.startsAt, snapshot.endsAt),
    ShowcaseEvent.find({
      status: 'published',
      $and: [
        { $or: [{ endAt: null }, { endAt: { $gte: now } }] },
        { $or: [{ submissionDeadline: null }, { submissionDeadline: { $gte: now } }] }
      ]
    }).sort({ submissionDeadline: 1, startAt: 1, updatedAt: -1 }).limit(10).lean()
  ])

  const shortFilms = shortFilmRecords.map(item => mapShortFilm({ ...item, creator: {
    name: item.creator?.name || 'A-MAX creator',
    username: item.creator?.username || '',
    avatarUrl: item.creator?.avatarUrl || ''
  } }))
  const trailers = snapshot.trailers
    .filter(isOfficialTrailerCandidate)
    .sort((left, right) => right.viewCount - left.viewCount
      || (right.publishedAt?.getTime() || 0) - (left.publishedAt?.getTime() || 0))
    .slice(0, 3)
    .map(mapTrailer)
  const scripts = scriptRecords.map(item => mapScript({ ...item, creator: {
    name: item.creator?.name || 'A-MAX creator',
    username: item.creator?.username || '',
    avatarUrl: item.creator?.avatarUrl || ''
  } }))
  const festivalSlides = events.map(mapEvent)
  return {
    week: {
      key: snapshot.weekKey,
      startsAt: snapshot.startsAt,
      endsAt: snapshot.endsAt,
      generatedAt: snapshot.generatedAt
    },
    sources: {
      shortFilmApprovalRequired: true,
      youtubeConfigured: snapshot.youtubeConfigured,
      youtubeSearchCount: snapshot.youtubeSearchCount,
      youtubeFailedSearches: snapshot.youtubeFailedSearches || 0,
      festivalScanAt: snapshot.festivalScanAt || null,
      festivalSourceCount: snapshot.festivalSourceCount || 0,
      festivalCheckedCount: snapshot.festivalCheckedCount || 0,
      festivalOpportunityCount: snapshot.festivalOpportunityCount || 0,
      festivalPublishedCount: snapshot.festivalPublishedCount || 0,
      festivalScanErrorCount: snapshot.festivalScanErrorCount || 0,
      festivalEventsManagedByAdmin: true
    },
    shortFilms,
    trailers,
    scripts,
    events: festivalSlides,
    slides: [...shortFilms, ...trailers, ...scripts, ...festivalSlides]
  }
}

export function scheduleWeeklyShowcaseRefresh(onWeeklyRefresh = async () => {}) {
  let timer
  let stopped = false
  const scheduleNext = () => {
    if (stopped) return
    const now = new Date()
    const nextRun = new Date(getIsoWeekWindow(now).endsAt.getTime() + 15 * 60 * 1000)
    if (nextRun <= now) nextRun.setUTCDate(nextRun.getUTCDate() + 7)
    timer = setTimeout(async () => {
      try { await getWeeklySnapshot({ force: true }) }
      catch (error) { console.error('Scheduled weekly showcase refresh failed:', error.message) }
      try { await onWeeklyRefresh() }
      catch (error) { console.error('Scheduled weekly showcase task failed:', error.message) }
      scheduleNext()
    }, nextRun.getTime() - now.getTime())
    timer.unref?.()
  }
  scheduleNext()
  return () => {
    stopped = true
    if (timer) clearTimeout(timer)
  }
}
