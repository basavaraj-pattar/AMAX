import mongoose from 'mongoose'
import ShowcaseEvent from '../models/ShowcaseEvent.js'
import WeeklyShowcase from '../models/WeeklyShowcase.js'
import { festivalSources } from '../data/festivalSources.js'
import { getIsoWeekWindow } from './showcase.js'

const BOT_NAME = 'AmaxFestivalOpportunitiesBot'
const MAX_HTML_BYTES = 1_200_000
const MAX_ROBOTS_BYTES = 160_000
const REQUEST_TIMEOUT_MS = 10_000
const MAX_DETAIL_PAGES_PER_SOURCE = 2
const SUBMISSION_HOSTS = new Set(['filmfreeway.com', 'festhome.com', 'shortfilmdepot.com', 'filmfestivals.com', 'eventival.com'])
let inFlightScan

function hostKey(hostname) { return hostname.toLowerCase().replace(/^www\./, '') }

function decodeHtml(value = '') {
  return value
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;|&#34;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_match, number) => String.fromCodePoint(Number(number)))
    .replace(/&#x([\da-f]+);/gi, (_match, number) => String.fromCodePoint(parseInt(number, 16)))
}

function attribute(source, name) {
  const match = source.match(new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'))
  return decodeHtml(match?.[1] || match?.[2] || match?.[3] || '').trim()
}

function htmlText(html = '') {
  return decodeHtml(html
    .replace(/<(script|style|noscript|svg|template)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, ' ')
    .replace(/<(br|\/p|\/div|\/section|\/article|\/li|\/h[1-6]|\/tr)\b[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, ' '))
    .replace(/[\t\f\v ]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{2,}/g, '\n')
    .trim()
}

function metaContent(html, key) {
  for (const match of html.matchAll(/<meta\b([^>]*)>/gi)) {
    const attrs = match[1]
    const name = attribute(attrs, 'name') || attribute(attrs, 'property')
    if (name.toLowerCase() === key.toLowerCase()) return attribute(attrs, 'content')
  }
  return ''
}

function parseLinks(html, pageUrl, rootHost) {
  const links = []
  for (const match of html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a\s*>/gi)) {
    const href = attribute(match[1], 'href')
    if (!href || /^(?:#|mailto:|tel:|javascript:|data:)/i.test(href)) continue
    try {
      const url = new URL(href, pageUrl)
      if (url.protocol !== 'https:') continue
      const host = hostKey(url.hostname)
      if (host !== rootHost && ![...SUBMISSION_HOSTS].some(allowed => host === allowed || host.endsWith(`.${allowed}`))) continue
      url.hash = ''
      links.push({ url: url.toString(), text: htmlText(match[2]).slice(0, 180) })
    } catch {}
  }
  return links
}

function readJsonLd(html) {
  const records = []
  const collect = value => {
    if (!value || typeof value !== 'object') return
    if (Array.isArray(value)) return value.forEach(collect)
    records.push(value)
    collect(value['@graph'])
    collect(value.itemListElement)
  }
  for (const match of html.matchAll(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script\s*>/gi)) {
    try { collect(JSON.parse(match[1].trim())) } catch {}
  }
  return records
}

async function readBodyLimited(response, maxBytes) {
  const statedSize = Number(response.headers.get('content-length'))
  if (Number.isFinite(statedSize) && statedSize > maxBytes) throw new Error('response exceeded the size limit')
  if (!response.body) return ''
  const reader = response.body.getReader()
  const chunks = []
  let size = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    size += value.byteLength
    if (size > maxBytes) {
      await reader.cancel().catch(() => {})
      throw new Error('response exceeded the size limit')
    }
    chunks.push(value)
  }
  const bytes = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength }
  return new TextDecoder().decode(bytes)
}

async function fetchText(url, { maxBytes = MAX_HTML_BYTES, expectedHost, robots = false } = {}) {
  let currentUrl = new URL(url)
  for (let redirectCount = 0; redirectCount <= 2; redirectCount++) {
    if (currentUrl.protocol !== 'https:' || hostKey(currentUrl.hostname) !== expectedHost) throw new Error('redirect left the official festival domain')
    const response = await fetch(currentUrl, {
      redirect: 'manual',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: { 'User-Agent': `${BOT_NAME}/1.0 (+weekly public festival-call indexer)`, Accept: 'text/html, application/xhtml+xml, text/plain;q=0.8' }
    })
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location')
      if (!location || redirectCount === 2) throw new Error('too many or invalid redirects')
      currentUrl = new URL(location, currentUrl)
      continue
    }
    if (robots && response.status === 404) return { ok: true, url: currentUrl.toString(), text: '' }
    if (!response.ok) throw new Error(`website returned HTTP ${response.status}`)
    const contentType = (response.headers.get('content-type') || '').toLowerCase()
    if (!robots && !contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) throw new Error('page was not HTML')
    return { ok: true, url: currentUrl.toString(), text: await readBodyLimited(response, maxBytes) }
  }
  throw new Error('request could not be completed')
}

function robotsAllows(robotsText, path) {
  const groups = []
  let group = { agents: [], rules: [] }
  const finish = () => { if (group.agents.length) groups.push(group); group = { agents: [], rules: [] } }
  for (const rawLine of robotsText.split(/\r?\n/)) {
    const line = rawLine.split('#', 1)[0].trim()
    if (!line) continue
    const separator = line.indexOf(':')
    if (separator < 0) continue
    const directive = line.slice(0, separator).trim().toLowerCase()
    const value = line.slice(separator + 1).trim()
    if (directive === 'user-agent') {
      if (group.rules.length) finish()
      group.agents.push(value.toLowerCase())
    } else if ((directive === 'allow' || directive === 'disallow') && group.agents.length && value) {
      group.rules.push({ allow: directive === 'allow', path: value })
    }
  }
  finish()
  const applicable = groups.filter(item => item.agents.includes('*') || item.agents.some(agent => BOT_NAME.toLowerCase().includes(agent)))
  const rules = applicable.flatMap(item => item.rules).filter(rule => path.startsWith(rule.path))
  rules.sort((left, right) => right.path.length - left.path.length || Number(right.allow) - Number(left.allow))
  return rules.length === 0 || rules[0].allow
}

function parseDateText(value, order = 'dmy') {
  const text = value.trim()
  let year, month, day
  let match = text.match(/\b(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})\b/)
  if (match) [, year, month, day] = match
  if (!match) {
    match = text.match(/\b(\d{1,2})\s*(?:st|nd|rd|th)?\s+([A-Za-z]{3,9})\s*,?\s*(20\d{2})\b/i)
    if (match) [, day, month, year] = match
  }
  if (!match) {
    match = text.match(/\b([A-Za-z]{3,9})\s+(\d{1,2})(?:st|nd|rd|th)?\s*,?\s*(20\d{2})\b/i)
    if (match) [, month, day, year] = match
  }
  if (!match) {
    match = text.match(/\b(\d{1,2})[/.\-](\d{1,2})[/.\-](20\d{2})\b/)
    if (match) {
      const first = Number(match[1]), second = Number(match[2])
      ;[, day, month, year] = match
      if (order === 'mdy') { month = first; day = second }
      else if (order === 'ymd') { year = match[1]; month = match[2]; day = match[3] }
    }
  }
  if (!match) return null
  const monthNumber = /^\d+$/.test(String(month)) ? Number(month) : new Date(`${month} 1, 2000 UTC`).getUTCMonth() + 1
  const result = new Date(Date.UTC(Number(year), monthNumber - 1, Number(day), 23, 59, 59, 999))
  return Number.isFinite(result.getTime()) && result.getUTCFullYear() === Number(year) && result.getUTCMonth() === monthNumber - 1 && result.getUTCDate() === Number(day) ? result : null
}

function findSubmissionDeadline(text, structured, source) {
  const labels = /(?:submission|film entry|entry|early\s*bird|regular)\s*(?:submission\s*)?(?:deadline|closing date|closes|close|cutoff|last date)|(?:deadline|closing date|closing|last date)\s*(?:for\s*)?(?:film\s*)?(?:submissions?|entries?)|submit(?:ting)?\s+(?:by|before)|call for entries.{0,35}(?:closes|deadline)/ig
  for (const match of text.matchAll(labels)) {
    // Deadline labels and their date are often rendered as adjacent HTML blocks,
    // which htmlText separates with a newline. Keep the whole nearby context.
    const context = text.slice(match.index, match.index + 220)
    const date = parseDateText(context, source.dateOrder)
    if (date) return date
  }
  for (const record of structured) {
    const type = [record['@type']].flat().join(' ').toLowerCase()
    if (!/event|competition/.test(type)) continue
    for (const offer of [record.offers].flat().filter(Boolean).flatMap(value => Array.isArray(value) ? value : [value])) {
      const date = parseDateText(String(offer.validThrough || ''), source.dateOrder)
      if (date) return date
    }
    const date = parseDateText(String(record.submissionDeadline || record.applicationDeadline || ''), source.dateOrder)
    if (date) return date
  }
  return null
}

function findEventDates(structured, source) {
  for (const record of structured) {
    const type = [record['@type']].flat().join(' ').toLowerCase()
    if (!/event|competition/.test(type)) continue
    const startAt = record.startDate ? new Date(record.startDate) : null
    const endAt = record.endDate ? new Date(record.endDate) : null
    return {
      startAt: startAt && Number.isFinite(startAt.getTime()) ? startAt : null,
      endAt: endAt && Number.isFinite(endAt.getTime()) ? endAt : null
    }
  }
  return { startAt: null, endAt: null }
}

function isSubmissionLink(link) {
  return /call for entries|submit(?: a| your| film| now)?|film submission|submissions?|enter (?:your )?film|application|apply (?:now|here)/i.test(link.text)
    || /(?:\/submit|\/submission|\/entry|\/apply|filmfreeway|shortfilmdepot|festhome|eventival)/i.test(link.url)
}

function isOpenCall(text) {
  return /call for (?:film )?entries|submissions? (?:are )?(?:now )?open|accepting (?:film )?submissions|submit your film|film entries are open|short film competition|short[- ]film submissions/i.test(text)
}

function getCandidate(source, page, now) {
  const text = htmlText(page.html)
  if (!isOpenCall(text)) return null
  const structured = readJsonLd(page.html)
  const deadline = findSubmissionDeadline(text, structured, source)
  if (!deadline || deadline < now) return null
  const application = page.links.find(isSubmissionLink)
  if (!application) return null
  const dates = findEventDates(structured, source)
  const year = deadline.getUTCFullYear()
  const title = `${source.name} ${year} submissions`.slice(0, 160)
  const description = metaContent(page.html, 'description') || `${source.category} · official submission call found on ${new URL(source.url).hostname}.`
  const summary = `${source.category} · submissions open`
  const posterUrl = metaContent(page.html, 'og:image') || metaContent(page.html, 'twitter:image')
  let safePoster = ''
  try { const image = new URL(posterUrl, page.url); if (image.protocol === 'https:') safePoster = image.toString() } catch {}
  return {
    sourceKey: `festival-crawler:${source.id}:${year}`,
    sourceName: source.name,
    sourceUrl: page.url,
    title,
    eventType: 'competition',
    summary,
    description: description.slice(0, 3000),
    posterUrl: safePoster,
    region: source.region,
    startAt: dates.startAt,
    endAt: dates.endAt || deadline,
    submissionDeadline: deadline,
    applicationUrl: application.url,
    eventUrl: page.url,
    status: 'published',
    autoManaged: true,
    lastCheckedAt: now,
    createdBy: 'festival-crawler',
    updatedBy: 'festival-crawler'
  }
}

async function crawlSource(source, now) {
  const baseUrl = new URL(source.url)
  const rootHost = hostKey(baseUrl.hostname)
  const robotsUrl = new URL('/robots.txt', baseUrl)
  const robots = await fetchText(robotsUrl.toString(), { maxBytes: MAX_ROBOTS_BYTES, expectedHost: rootHost, robots: true })
  if (!robotsAllows(robots.text, baseUrl.pathname)) return { source, skipped: true, reason: 'robots.txt disallows the homepage' }

  const homepage = await fetchText(source.url, { expectedHost: rootHost })
  const pages = [{ url: homepage.url, html: homepage.text }]
  const links = parseLinks(homepage.text, homepage.url, rootHost)
  const detailPages = links.filter(link => /call for entries|submit|submission|short.?film|competition|entry|apply/i.test(`${link.text} ${link.url}`))
    .filter(link => hostKey(new URL(link.url).hostname) === rootHost)
    .slice(0, MAX_DETAIL_PAGES_PER_SOURCE)
  for (const link of detailPages) {
    try {
      const target = new URL(link.url)
      if (!robotsAllows(robots.text, target.pathname)) continue
      const page = await fetchText(link.url, { expectedHost: rootHost })
      pages.push({ url: page.url, html: page.text })
    } catch (error) {
      // A single unavailable detail link should not block other official pages.
      console.warn(`Festival detail page skipped (${source.id}): ${error.message}`)
    }
  }
  for (const page of pages) {
    page.links = parseLinks(page.html, page.url, rootHost)
    const candidate = getCandidate(source, page, now)
    if (candidate) return { source, candidate, checked: true }
  }
  return { source, checked: true, candidate: null }
}

async function runWithLimit(items, limit, worker) {
  const results = new Array(items.length)
  let cursor = 0
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const index = cursor++
      if (index >= items.length) return
      try { results[index] = await worker(items[index]) }
      catch (error) { results[index] = { source: items[index], error: error.message } }
    }
  })
  await Promise.all(runners)
  return results
}

async function upsertCandidate(candidate) {
  const existing = await ShowcaseEvent.findOne({ sourceKey: candidate.sourceKey })
  // Once a curator edits, unpublishes, or archives a listing, leave their decision alone.
  if (existing && (!existing.autoManaged || existing.status !== 'published')) return false
  if (existing) {
    for (const [field, value] of Object.entries(candidate)) {
      if (!['_id', 'createdBy', 'createdAt', 'sourceKey', 'autoManaged'].includes(field)) existing[field] = value
    }
    await existing.save()
  } else {
    await ShowcaseEvent.create(candidate)
  }
  return true
}

export async function refreshFestivalListings({ now = new Date() } = {}) {
  if (mongoose.connection.readyState !== 1) {
    throw Object.assign(new Error('Festival scanning is unavailable until MongoDB is connected.'), { status: 503 })
  }
  if (inFlightScan) return inFlightScan
  inFlightScan = (async () => {
    const results = await runWithLimit(festivalSources, 3, source => crawlSource(source, now))
    let publishedOrUpdated = 0
    for (const result of results) {
      if (result?.candidate) {
        try { if (await upsertCandidate(result.candidate)) publishedOrUpdated += 1 }
        catch (error) { result.error = `event save failed: ${error.message}` }
      }
    }
    const checked = results.filter(result => result?.checked).length
    const errors = results.filter(result => result?.error).map(result => ({ source: result.source.name, message: result.error.slice(0, 240) }))
    const report = {
      scannedAt: now,
      sourceCount: festivalSources.length,
      checkedCount: checked,
      opportunityCount: results.filter(result => result?.candidate).length,
      publishedOrUpdated,
      errorCount: errors.length,
      errors: errors.slice(0, 12)
    }
    const window = getIsoWeekWindow(now)
    await WeeklyShowcase.updateOne(
      { weekKey: window.weekKey },
      { $set: {
        festivalScanAt: report.scannedAt,
        festivalSourceCount: report.sourceCount,
        festivalCheckedCount: report.checkedCount,
        festivalOpportunityCount: report.opportunityCount,
        festivalPublishedCount: report.publishedOrUpdated,
        festivalScanErrorCount: report.errorCount
      }, $setOnInsert: { startsAt: window.startsAt, endsAt: window.endsAt, generatedAt: now } },
      { upsert: true }
    )
    return report
  })()
  try { return await inFlightScan }
  finally { inFlightScan = undefined }
}

export async function refreshFestivalListingsIfDue({ now = new Date() } = {}) {
  if (mongoose.connection.readyState !== 1) {
    throw Object.assign(new Error('Festival scanning is unavailable until MongoDB is connected.'), { status: 503 })
  }
  const { weekKey } = getIsoWeekWindow(now)
  const currentWeek = await WeeklyShowcase.findOne({ weekKey }).select('festivalScanAt').lean()
  if (currentWeek?.festivalScanAt) {
    return { skipped: true, reason: 'This week’s festival scan has already completed.', scannedAt: currentWeek.festivalScanAt }
  }
  return refreshFestivalListings({ now })
}
