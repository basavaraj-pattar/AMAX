import { Router } from 'express'
import mongoose from 'mongoose'
import { rm } from 'node:fs/promises'
import { join } from 'node:path'
import Comment from '../models/Comment.js'
import Content from '../models/Content.js'
import ContentView from '../models/ContentView.js'
import Notification from '../models/Notification.js'
import Report from '../models/Report.js'
import { filmVideoDirectory, scriptDocumentDirectory } from '../config/storage.js'
import { optionalProtect, protect } from '../middleware/auth.js'
import { notifyFilmActivity } from '../services/notifications.js'

const router = Router()
const publicCreatorFields = 'name username avatarUrl'

function validObjectId(value) {
  return mongoose.isValidObjectId(value)
}

export function contentForClient(content, userId) {
  const item = content.toObject ? content.toObject() : content
  const likes = item.likes || []
  const bookmarks = item.bookmarks || []
  const uniqueLikes = new Set(likes.map(id => String(id._id || id)))
  const uniqueBookmarks = new Set(bookmarks.map(id => String(id._id || id)))
  const creator = item.creator && typeof item.creator === 'object' && item.creator.name
    ? {
        _id: item.creator._id,
        name: item.creator.name,
        username: item.creator.username,
        avatarUrl: item.creator.avatarUrl
      }
    : item.creator
  return {
    _id: item._id,
    title: item.title,
    description: item.description || '',
    type: item.type,
    category: item.category || '',
    genre: item.genre || '',
    tags: item.tags || [],
    posterUrl: item.posterUrl || '',
    mediaUrl: item.mediaUrl || '',
    pageCount: Number.isSafeInteger(item.pageCount) ? item.pageCount : null,
    creator,
    views: item.views || 0,
    likes: uniqueLikes.size,
    liked: Boolean(userId && uniqueLikes.has(String(userId))),
    bookmarks: uniqueBookmarks.size,
    bookmarked: Boolean(userId && uniqueBookmarks.has(String(userId))),
    createdAt: item.createdAt
  }
}

async function findFilm(contentId) {
  if (!validObjectId(contentId)) return null
  return Content.findOne({ _id: contentId, type: 'film' })
}

async function findSaveableContent(contentId) {
  if (!validObjectId(contentId)) return null
  return Content.findOne({ _id: contentId, type: { $in: ['film', 'script', 'story'] } })
}

function commentForClient(comment, replies = []) {
  const item = comment.toObject ? comment.toObject() : comment
  return {
    _id: item._id,
    body: item.body,
    parent: item.parent,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    author: item.author,
    replies
  }
}

router.get('/saved', protect, async (req, res, next) => {
  try {
    const page = req.query.page === undefined ? 1 : Number(req.query.page)
    const requestedLimit = req.query.limit === undefined ? 50 : Number(req.query.limit)
    if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(requestedLimit) || requestedLimit < 1) {
      return res.status(400).json({ message: 'Invalid saved-content page.' })
    }
    const limit = Math.min(requestedLimit, 50)
    const filter = { type: { $in: ['film', 'script', 'story'] }, bookmarks: req.user._id }
    const [saved, counts] = await Promise.all([
      Content.find(filter)
        .populate('creator', publicCreatorFields)
        .sort('-updatedAt')
        .skip((page - 1) * limit)
        .limit(limit),
      Content.aggregate([
        { $match: filter },
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ])
    ])
    const countsByType = { film: 0, script: 0, story: 0 }
    for (const entry of counts) countsByType[entry._id] = entry.count
    const total = Object.values(countsByType).reduce((sum, count) => sum + count, 0)
    res.json({
      items: saved.map(item => contentForClient(item, req.user._id)),
      total,
      countsByType,
      page,
      hasMore: page * limit < total
    })
  } catch (error) {
    next(error)
  }
})

router.get('/', optionalProtect, async (req, res, next) => {
  try {
    const filter = { moderationStatus: { $ne: 'removed' } }
    if (req.query.type !== undefined) {
      if (typeof req.query.type !== 'string' || !['film', 'trailer', 'script', 'story', 'bts'].includes(req.query.type)) {
        return res.status(400).json({ message: 'Unsupported content type.' })
      }
      filter.type = req.query.type
    }
    const items = await Content.find(filter)
      .populate('creator', publicCreatorFields)
      .sort('-createdAt')
      .limit(100)
    res.json(items.map(item => contentForClient(item, req.user?._id)))
  } catch (error) {
    next(error)
  }
})

router.get('/mine', protect, async (req, res, next) => {
  try {
    const items = await Content.find({
      creator: req.user._id,
      moderationStatus: { $ne: 'removed' },
      type: { $in: ['film', 'script', 'story'] }
    }).populate('creator', publicCreatorFields).sort('-createdAt').limit(500)
    res.json(items.map(item => contentForClient(item, req.user._id)))
  } catch (error) { next(error) }
})

router.patch('/:id', protect, async (req, res, next) => {
  try {
    if (!validObjectId(req.params.id)) return res.status(404).json({ message: 'Content not found.' })
    const body = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {}
    const allowedFields = new Set(['posterUrl', 'description'])
    const keys = Object.keys(body)
    if (!keys.length || keys.some(key => !allowedFields.has(key))) {
      return res.status(400).json({ message: 'Only a poster and logline can be changed here.' })
    }
    if (Object.hasOwn(body, 'posterUrl') && (typeof body.posterUrl !== 'string' || body.posterUrl.length > 2_000_000)) {
      return res.status(400).json({ message: 'Choose an image smaller than 2 MB.' })
    }
    if (Object.hasOwn(body, 'description') && (typeof body.description !== 'string' || body.description.length > 5000)) {
      return res.status(400).json({ message: 'The logline must be 5,000 characters or fewer.' })
    }
    const updates = {}
    if (Object.hasOwn(body, 'posterUrl')) updates.posterUrl = body.posterUrl
    if (Object.hasOwn(body, 'description')) updates.description = body.description.trim()
    const content = await Content.findOneAndUpdate({
      _id: req.params.id,
      creator: req.user._id,
      moderationStatus: { $ne: 'removed' },
      type: { $in: ['film', 'script', 'story'] }
    }, { $set: updates }, { new: true, runValidators: true }).populate('creator', publicCreatorFields)
    if (!content) return res.status(404).json({ message: 'Your published content could not be found.' })
    const clientContent = contentForClient(content, req.user._id)
    req.app.get('io')?.emit('content:updated', clientContent)
    res.json(clientContent)
  } catch (error) { next(error) }
})

async function removeUploadedContentFile(mediaUrl) {
  if (typeof mediaUrl !== 'string' || !mediaUrl) return
  let pathname
  try { pathname = new URL(mediaUrl, 'http://localhost').pathname }
  catch { return }
  const video = pathname.match(/^\/api\/videos\/([a-f0-9-]{36}\.mp4)$/i)
  const document = pathname.match(/^\/api\/scripts\/files\/([a-f0-9-]{36}\.(?:pdf|doc|docx|txt))$/i)
  if (video) await rm(join(filmVideoDirectory, video[1]), { force: true })
  if (document) await rm(join(scriptDocumentDirectory, document[1]), { force: true })
}

router.delete('/:id', protect, async (req, res, next) => {
  try {
    if (!validObjectId(req.params.id)) return res.status(404).json({ message: 'Content not found.' })
    const content = await Content.findOneAndDelete({
      _id: req.params.id,
      creator: req.user._id,
      type: { $in: ['film', 'script', 'story'] }
    })
    if (!content) return res.status(404).json({ message: 'Your published content could not be found.' })

    const comments = await Comment.find({ content: content._id }).select('_id').lean()
    const commentIds = comments.map(comment => comment._id)
    await Promise.all([
      Comment.deleteMany({ content: content._id }),
      ContentView.deleteMany({ contentId: content._id }),
      Notification.deleteMany({ $or: [{ content: content._id }, ...(commentIds.length ? [{ comment: { $in: commentIds } }] : [])] }),
      Report.deleteMany({ contentType: 'content', contentId: content._id })
    ])
    await removeUploadedContentFile(content.mediaUrl)
    req.app.get('io')?.emit('content:removed', { contentId: String(content._id), type: content.type })
    res.json({ deleted: true, contentId: String(content._id) })
  } catch (error) { next(error) }
})

router.get('/:id', optionalProtect, async (req, res, next) => {
  try {
    if (!validObjectId(req.params.id)) return res.status(404).json({ message: 'Content not found.' })
    const content = await Content.findOne({ _id: req.params.id, moderationStatus: { $ne: 'removed' } }).populate('creator', publicCreatorFields)
    if (!content) return res.status(404).json({ message: 'Content not found.' })
    res.json(contentForClient(content, req.user?._id))
  } catch (error) {
    next(error)
  }
})

router.post('/:id/view', protect, async (req, res, next) => {
  try {
    if (!validObjectId(req.params.id)) return res.status(404).json({ message: 'Content not found.' })
    const content = await Content.findOne({ _id: req.params.id, moderationStatus: 'published' }).select('_id views')
    if (!content) return res.status(404).json({ message: 'Content not found.' })

    const now = new Date()
    const dayKey = now.toISOString().slice(0, 10)
    let counted = false
    try {
      const result = await ContentView.collection.updateOne(
        { contentId: content._id, viewerId: req.user._id, dayKey },
        { $setOnInsert: {
          contentId: content._id,
          viewerId: req.user._id,
          dayKey,
          expiresAt: new Date(now.getTime() + 35 * 24 * 60 * 60 * 1000),
          createdAt: now,
          updatedAt: now
        } },
        { upsert: true }
      )
      counted = Boolean(result.upsertedCount)
    } catch (error) {
      if (error.code !== 11000) throw error
    }

    if (counted) {
      let updated
      try {
        updated = await Content.findOneAndUpdate(
          { _id: content._id, moderationStatus: 'published' },
          { $inc: { views: 1 } },
          { new: true }
        ).select('views').lean()
      } catch (error) {
        await ContentView.deleteOne({ contentId: content._id, viewerId: req.user._id, dayKey }).catch(() => {})
        throw error
      }
      if (!updated) {
        await ContentView.deleteOne({ contentId: content._id, viewerId: req.user._id, dayKey })
        return res.status(404).json({ message: 'Content not found.' })
      }
      return res.status(201).json({ views: updated.views || 0, counted: true })
    }

    const latest = await Content.findById(content._id).select('views').lean()
    if (!latest) return res.status(404).json({ message: 'Content not found.' })
    res.json({ views: latest.views || 0, counted: false })
  } catch (error) { next(error) }
})

router.post('/', protect, async (req, res, next) => {
  try {
    const { title, description = '', type, category = '', genre = '', tags = [], posterUrl = '', mediaUrl = '', pageCount = null } = req.body || {}
    if (typeof title !== 'string' || !title.trim() || title.trim().length > 160) {
      return res.status(400).json({ message: 'A film title of 1 to 160 characters is required.' })
    }
    if (['script', 'story'].includes(type) && (!Number.isSafeInteger(pageCount) || pageCount < 1 || pageCount > 10000)) {
      return res.status(400).json({ message: 'Provide a page count from 1 to 10,000 for scripts and stories.' })
    }
    if (typeof description !== 'string' || description.length > 5000
      || typeof category !== 'string' || category.length > 80
      || typeof genre !== 'string' || genre.length > 120
      || !['film', 'trailer', 'script', 'story', 'bts'].includes(type)
      || (pageCount !== null && (!Number.isSafeInteger(pageCount) || pageCount < 1 || pageCount > 10000 || !['script', 'story'].includes(type)))
      || !Array.isArray(tags) || tags.length > 20 || tags.some(tag => typeof tag !== 'string' || tag.length > 50)
      || typeof posterUrl !== 'string' || posterUrl.length > 2_000_000
      || typeof mediaUrl !== 'string' || mediaUrl.length > 500) {
      return res.status(400).json({ message: 'Film details are invalid or exceed the allowed limits.' })
    }
    const content = await Content.create({
      title: title.trim(), description: description.trim(), type,
      category: category.trim(), genre: genre.trim(),
      tags: tags.map(tag => tag.trim()).filter(Boolean),
      ...(pageCount === null ? {} : { pageCount }),
      posterUrl, mediaUrl, creator: req.user._id
    })
    await content.populate('creator', publicCreatorFields)
    const clientContent = contentForClient(content, req.user._id)
    req.app.get('io')?.emit('content:published', clientContent)
    res.status(201).json(clientContent)
  } catch (error) {
    next(error)
  }
})

router.put('/:id/like', protect, async (req, res, next) => {
  try {
    if (typeof req.body?.liked !== 'boolean') return res.status(400).json({ message: 'The liked state must be true or false.' })
    const filter = await findFilm(req.params.id)
    if (!filter) return res.status(404).json({ message: 'Film not found.' })

    const updateResult = await Content.updateOne(
      { _id: filter._id, type: 'film' },
      req.body.liked
        ? { $addToSet: { likes: req.user._id } }
        : { $pull: { likes: req.user._id } }
    )
    if (!updateResult.matchedCount) return res.status(404).json({ message: 'Film not found.' })
    if (req.body.liked && !filter.creator.equals(req.user._id)) {
      const eventKey = `like:${filter._id}:${req.user._id}`
      const existingNotification = await Notification.exists({ eventKey })
      try {
        await notifyFilmActivity(req, {
          recipient: filter.creator,
          actor: req.user._id,
          content: filter._id,
          type: 'like',
          eventKey
        })
      } catch (error) {
        if (updateResult.modifiedCount) {
          await Content.updateOne({ _id: filter._id, likes: req.user._id }, { $pull: { likes: req.user._id } })
        }
        if (!existingNotification) await Notification.deleteOne({ eventKey })
        throw error
      }
    }
    const updated = await Content.findById(filter._id).select('likes')
    if (!updated) return res.status(404).json({ message: 'Film not found.' })
    res.json({ likes: updated.likes.length, liked: updated.likes.some(id => id.equals(req.user._id)) })
  } catch (error) {
    next(error)
  }
})

router.put('/:id/bookmark', protect, async (req, res, next) => {
  try {
    if (typeof req.body?.bookmarked !== 'boolean') return res.status(400).json({ message: 'The saved state must be true or false.' })
    const content = await findSaveableContent(req.params.id)
    if (!content) return res.status(404).json({ message: 'Saveable content not found.' })
    const result = await Content.updateOne(
      { _id: content._id, type: { $in: ['film', 'script', 'story'] } },
      req.body.bookmarked
        ? { $addToSet: { bookmarks: req.user._id } }
        : { $pull: { bookmarks: req.user._id } }
    )
    if (!result.matchedCount) return res.status(404).json({ message: 'Saveable content not found.' })
    const updated = await Content.findById(content._id).select('bookmarks')
    if (!updated) return res.status(404).json({ message: 'Saveable content not found.' })
    const uniqueBookmarks = new Set(updated.bookmarks.map(id => String(id)))
    res.json({
      bookmarks: uniqueBookmarks.size,
      bookmarked: uniqueBookmarks.has(String(req.user._id))
    })
  } catch (error) {
    next(error)
  }
})

router.get('/:id/comments', async (req, res, next) => {
  try {
    const film = await findFilm(req.params.id)
    if (!film) return res.status(404).json({ message: 'Film not found.' })
    const page = Number.parseInt(req.query.page, 10) || 1
    const limit = Math.min(Number.parseInt(req.query.limit, 10) || 30, 50)
    if (page < 1 || limit < 1) return res.status(400).json({ message: 'Invalid comment page.' })
    const roots = await Comment.find({ content: film._id, parent: null })
      .populate('author', publicCreatorFields)
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(limit)
    const rootIds = roots.map(comment => comment._id)
    const [replies, total, rootCount] = await Promise.all([
      Comment.find({ content: film._id, parent: { $in: rootIds } })
        .populate('author', publicCreatorFields)
        .sort('createdAt'),
      Comment.countDocuments({ content: film._id }),
      Comment.countDocuments({ content: film._id, parent: null })
    ])
    const repliesByParent = new Map()
    for (const reply of replies) {
      const parentId = String(reply.parent)
      repliesByParent.set(parentId, [...(repliesByParent.get(parentId) || []), commentForClient(reply)])
    }
    res.json({
      comments: roots.map(comment => commentForClient(comment, repliesByParent.get(String(comment._id)) || [])),
      total,
      page,
      hasMore: page * limit < rootCount
    })
  } catch (error) {
    next(error)
  }
})

router.post('/:id/comments', protect, async (req, res, next) => {
  try {
    const film = await findFilm(req.params.id)
    if (!film) return res.status(404).json({ message: 'Film not found.' })
    const requestBody = req.body || {}
    const body = typeof requestBody.body === 'string' ? requestBody.body.trim() : ''
    if (!body || body.length > 1000) return res.status(400).json({ message: 'Comments must contain 1 to 1,000 characters.' })
    const clientRequestId = requestBody.clientRequestId
    if (typeof clientRequestId !== 'string' || !/^[a-f0-9-]{36}$/i.test(clientRequestId)) {
      return res.status(400).json({ message: 'A valid comment request ID is required.' })
    }
    let parent = null
    if (requestBody.parent !== undefined && requestBody.parent !== null) {
      if (!validObjectId(requestBody.parent)) return res.status(400).json({ message: 'The comment to reply to is invalid.' })
      parent = await Comment.findOne({ _id: requestBody.parent, content: film._id, parent: null })
      if (!parent) return res.status(404).json({ message: 'The comment to reply to was not found.' })
    }
    const parentId = parent?._id || null
    let comment = await Comment.findOne({ author: req.user._id, clientRequestId })
    if (comment && (
      !comment.content.equals(film._id)
      || String(comment.parent || '') !== String(parentId || '')
      || comment.body !== body
    )) {
      return res.status(409).json({ message: 'This comment request ID was already used for different content.' })
    }
    if (!comment) {
      try {
        comment = await Comment.create({
          content: film._id,
          author: req.user._id,
          parent: parentId,
          clientRequestId,
          body
        })
      } catch (error) {
        if (error.code !== 11000) throw error
        comment = await Comment.findOne({ author: req.user._id, clientRequestId })
        if (!comment) throw error
      }
    }
    if (
      !comment.content.equals(film._id)
      || String(comment.parent || '') !== String(parentId || '')
      || comment.body !== body
    ) {
      return res.status(409).json({ message: 'This comment request ID was already used for different content.' })
    }
    await comment.populate('author', publicCreatorFields)
    const recipient = parent?.author || film.creator
    await notifyFilmActivity(req, {
      recipient,
      actor: req.user._id,
      content: film._id,
      comment: comment._id,
      type: parent ? 'reply' : 'comment',
      eventKey: `comment:${comment._id}`
    })
    res.status(201).json(commentForClient(comment))
  } catch (error) {
    next(error)
  }
})

router.patch('/:id/comments/:commentId', protect, async (req, res, next) => {
  try {
    if (!validObjectId(req.params.id) || !validObjectId(req.params.commentId)) return res.status(404).json({ message: 'Comment not found.' })
    const body = typeof req.body?.body === 'string' ? req.body.body.trim() : ''
    if (!body || body.length > 1000) return res.status(400).json({ message: 'Comments must contain 1 to 1,000 characters.' })
    const comment = await Comment.findOne({ _id: req.params.commentId, content: req.params.id })
    if (!comment) return res.status(404).json({ message: 'Comment not found.' })
    if (!comment.author.equals(req.user._id) && !req.user.roles.includes('admin')) {
      return res.status(403).json({ message: 'You can only edit your own comments.' })
    }
    comment.body = body
    await comment.save()
    await comment.populate('author', publicCreatorFields)
    res.json(commentForClient(comment))
  } catch (error) {
    next(error)
  }
})

router.delete('/:id/comments/:commentId', protect, async (req, res, next) => {
  try {
    if (!validObjectId(req.params.id) || !validObjectId(req.params.commentId)) return res.status(404).json({ message: 'Comment not found.' })
    const comment = await Comment.findOne({ _id: req.params.commentId, content: req.params.id })
    if (!comment) return res.status(404).json({ message: 'Comment not found.' })
    if (!comment.author.equals(req.user._id) && !req.user.roles.includes('admin')) {
      return res.status(403).json({ message: 'You can only delete your own comments.' })
    }
    if (!comment.parent) await Comment.deleteMany({ parent: comment._id })
    await comment.deleteOne()
    res.json({ deleted: true })
  } catch (error) {
    next(error)
  }
})

export default router
