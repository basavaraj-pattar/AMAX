import test from 'node:test'
import assert from 'node:assert/strict'
import { contentForClient } from '../src/routes/content.routes.js'
import Comment from '../src/models/Comment.js'
import Notification from '../src/models/Notification.js'

test('film responses return real counts and per-user states without exposing liker IDs', () => {
  const film = contentForClient({
    _id: 'film-id',
    title: 'A Quiet Frame',
    type: 'film',
    creator: { _id: 'owner-id', name: 'Film Owner', username: 'owner', passwordHash: 'never-expose' },
    likes: [{ _id: 'viewer-id' }, { _id: 'another-viewer-id' }],
    bookmarks: [{ _id: 'viewer-id' }],
    views: 17
  }, 'viewer-id')

  assert.equal(film.likes, 2)
  assert.equal(film.liked, true)
  assert.equal(film.bookmarks, 1)
  assert.equal(film.bookmarked, true)
  assert.equal(film.views, 17)
  assert.equal('passwordHash' in film.creator, false)
  assert.equal(Array.isArray(film.likes), false)
  assert.equal(JSON.stringify(film).includes('another-viewer-id'), false)
})

test('script and story responses expose unique saved counts and viewer state', () => {
  for (const type of ['script', 'story']) {
    const saved = contentForClient({
      _id: `${type}-id`,
      title: `A ${type}`,
      type,
      creator: { _id: 'writer-id', name: 'Writer', username: 'writer' },
      bookmarks: [{ _id: 'reader-id' }, 'reader-id', { _id: 'another-reader-id' }]
    }, 'reader-id')

    assert.equal(saved.bookmarks, 2)
    assert.equal(saved.bookmarked, true)
    assert.equal(JSON.stringify(saved).includes('another-reader-id'), false)
  }
})

test('comments enforce unique idempotency keys and notifications enforce unique event keys', () => {
  const commentIndexes = Comment.schema.indexes()
  const notificationIndexes = Notification.schema.indexes()
  assert.ok(commentIndexes.some(([keys, options]) =>
    keys.author === 1 && keys.clientRequestId === 1 && options.unique && options.partialFilterExpression
  ))
  assert.ok(notificationIndexes.some(([keys, options]) =>
    keys.eventKey === 1 && options.unique && options.sparse
  ))
})
