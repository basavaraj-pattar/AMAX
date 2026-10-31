import test from 'node:test'
import assert from 'node:assert/strict'
import { fetchYoutubeTrailers, youtubeSearchUrl } from '../src/routes/trailer.routes.js'

test('YouTube search URL encodes all required query parameters', () => {
  const url = new URL(youtubeSearchUrl('test-key'))

  assert.equal(url.origin, 'https://www.googleapis.com')
  assert.equal(url.pathname, '/youtube/v3/search')
  assert.deepEqual(Object.fromEntries(url.searchParams), {
    part: 'snippet',
    type: 'video',
    q: 'official movie trailer 2026',
    order: 'date',
    maxResults: '10',
    key: 'test-key'
  })
})

test('YouTube results are mapped into safe homepage trailer data', async () => {
  let requestedUrl
  const trailers = await fetchYoutubeTrailers('test-key', async url => {
    requestedUrl = new URL(url)
    return {
      ok: true,
      json: async () => ({
        items: [
          {
            id: { videoId: 'video-123' },
            snippet: {
              title: 'Official Trailer',
              thumbnails: { high: { url: 'https://img.youtube.com/poster.jpg' } }
            }
          },
          { id: { channelId: 'not-a-video' }, snippet: { title: 'Ignore me' } }
        ]
      })
    }
  })

  assert.equal(requestedUrl.searchParams.get('q'), 'official movie trailer 2026')
  assert.deepEqual(trailers, [{
    videoId: 'video-123',
    watchUrl: 'https://www.youtube.com/watch?v=video-123',
    type: 'FEATURED TRAILER',
    title: 'Official Trailer',
    poster: 'https://img.youtube.com/poster.jpg',
    action: 'Watch now'
  }])
})
