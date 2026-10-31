import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import http from 'http'
import { Server } from 'socket.io'
import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'
import User from './models/User.js'
import Community from './models/Community.js'
import CommunityMessage from './models/CommunityMessage.js'
import CommunityMembershipRequest from './models/CommunityMembershipRequest.js'
import MessageAttachment from './models/MessageAttachment.js'
import authRoutes from './routes/auth.routes.js'
import contentRoutes from './routes/content.routes.js'
import communityRoutes from './routes/community.routes.js'
import messageRoutes from './routes/message.routes.js'
import trailerRoutes from './routes/trailer.routes.js'
import profileRoutes from './routes/profile.routes.js'
import filmUploadRoutes, { filmVideoDirectory } from './routes/film-upload.routes.js'
import notificationRoutes from './routes/notification.routes.js'
import Comment from './models/Comment.js'
import Notification from './models/Notification.js'
import scriptUploadRoutes, { scriptDocumentDirectory } from './routes/script-upload.routes.js'
import equipmentRoutes from './routes/equipment.routes.js'
import EquipmentRequest from './models/EquipmentRequest.js'
import adminRoutes from './routes/admin.routes.js'
import reportsRoutes from './routes/reports.routes.js'
import Report from './models/Report.js'
import AuditLog from './models/AuditLog.js'
import AdminAccount from './models/AdminAccount.js'
import Content from './models/Content.js'
import ContentView from './models/ContentView.js'
import ShowcaseEvent from './models/ShowcaseEvent.js'
import WeeklyShowcase from './models/WeeklyShowcase.js'
import showcaseRoutes from './routes/showcase.routes.js'
import showcaseAdminRoutes from './routes/showcase-admin.routes.js'
import { getWeeklySnapshot, scheduleWeeklyShowcaseRefresh } from './services/showcase.js'
import { refreshFestivalListings, refreshFestivalListingsIfDue } from './services/festivalCrawler.js'
import { ensureDefaultCommunities } from './services/community.js'
import { cleanupExpiredMessageAttachments } from './services/message-attachments.js'

const app = express()
const server = http.createServer(app)
const clientUrls = (process.env.CLIENT_URL || 'http://localhost:5174')
  .split(',')
  .map(origin => origin.trim().replace(/\/$/, ''))
  .filter(Boolean)
const localDevelopmentUrls = process.env.NODE_ENV === 'production' ? [] : [
  'http://localhost:5174',
  'http://localhost:5175',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5175'
]
const allowedClientOrigins = [...new Set([...clientUrls, ...localDevelopmentUrls])]
const isAllowedClientOrigin = origin => !origin || allowedClientOrigins.includes(origin)
const corsOrigin = (origin, callback) => callback(
  isAllowedClientOrigin(origin) ? null : new Error('Origin is not allowed by CORS.'),
  isAllowedClientOrigin(origin)
)
const io = new Server(server, { cors: { origin: allowedClientOrigins, methods: ['GET', 'POST'] } })
const port = process.env.PORT || 5000

app.use(cors({ origin: corsOrigin, methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], allowedHeaders: ['Content-Type', 'Authorization', 'X-File-Name'] }))
app.use(express.json({ limit: '2mb' }))
app.get('/api/health', (_req, res) => res.json({ name: 'A-MAX API', status: 'online', timestamp: new Date().toISOString() }))
app.set('io', io)
app.use('/api/auth', authRoutes)
app.use('/api/messages', messageRoutes)
app.use('/api/trailers', trailerRoutes)
app.use('/api/profiles', profileRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/equipment', equipmentRoutes)
app.use('/api/uploads/films', filmUploadRoutes)
app.use('/api/uploads/scripts', scriptUploadRoutes)
app.use('/api/scripts/files', express.static(scriptDocumentDirectory, {
  dotfiles: 'deny',
  index: false,
  setHeaders(response) {
    response.setHeader('X-Content-Type-Options', 'nosniff')
    response.setHeader('Content-Security-Policy', "default-src 'none'; sandbox")
  }
}))
app.use('/api/videos', express.static(filmVideoDirectory, { acceptRanges: true, dotfiles: 'deny', index: false }))
app.use('/api/content', contentRoutes)
app.use('/api/communities', communityRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/reports', reportsRoutes)
app.use('/api/showcase', showcaseRoutes)
app.use('/api/admin/showcase', showcaseAdminRoutes)
app.use((error, _req, res, _next) => {
  const status = error.status || 500
  if (status >= 500) console.error('API request failed:', error)
  res.status(status).json({ message: status >= 500 ? 'Something went wrong. Please try again.' : error.message })
})

io.use(async (socket, next) => {
  try {
    if (!process.env.JWT_SECRET || mongoose.connection.readyState !== 1) {
      return next(new Error('Messaging is unavailable. Check the API session secret and MongoDB connection.'))
    }
    const token = socket.handshake.auth?.token
    if (typeof token !== 'string' || !token) return next(new Error('Authentication required.'))
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.id).select('_id')
    if (!user) return next(new Error('Account not found.'))
    socket.data.userId = String(user._id)
    socket.data.tokenExpiresAt = decoded.exp * 1000
    next()
  } catch {
    next(new Error('Invalid or expired session.'))
  }
})

io.on('connection', socket => {
  socket.join(`user:${socket.data.userId}`)
  const expireTimer = setTimeout(() => socket.disconnect(true), Math.max(0, socket.data.tokenExpiresAt - Date.now()))
  socket.on('conversation:join', async (conversationId, acknowledge = () => {}) => {
    if (typeof acknowledge !== 'function') return
    try {
      if (!mongoose.isValidObjectId(conversationId)) return acknowledge({ error: 'Conversation not found.' })
      const authorized = await mongoose.model('Conversation').exists({
        _id: conversationId,
        'participants.user': socket.data.userId
      })
      if (!authorized) return acknowledge({ error: 'Conversation not found.' })
      socket.join(`conversation:${conversationId}`)
      acknowledge({ ok: true })
    } catch {
      acknowledge({ error: 'Unable to join this conversation.' })
    }
  })
  socket.on('conversation:leave', conversationId => {
    if (mongoose.isValidObjectId(conversationId)) socket.leave(`conversation:${conversationId}`)
  })
  socket.on('community:join', async (communityId, acknowledge = () => {}) => {
    if (typeof acknowledge !== 'function') return
    try {
      if (!mongoose.isValidObjectId(communityId)) return acknowledge({ error: 'Community not found.' })
      const authorized = await Community.exists({ _id: communityId, members: socket.data.userId })
      if (!authorized) return acknowledge({ error: 'Community membership is required.' })
      socket.join(`community:${communityId}`)
      acknowledge({ ok: true })
    } catch {
      acknowledge({ error: 'Unable to join this community discussion.' })
    }
  })
  socket.on('community:leave', communityId => {
    if (mongoose.isValidObjectId(communityId)) socket.leave(`community:${communityId}`)
  })
  socket.on('disconnect', () => clearTimeout(expireTimer))
})

async function start() {
  // Start the HTTP API immediately so health checks and auth routes can
  // return useful database status while MongoDB is connecting.
  server.listen(port, () => console.log(`A-MAX API listening on http://localhost:${port}`))

  if (process.env.MONGO_URI) {
    let retryDelayMs = 1000
    while (mongoose.connection.readyState !== 1) {
      try {
        await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 })
        console.log('MongoDB connected')
      } catch (error) {
        console.warn(`MongoDB unavailable; retrying: ${error.message}`)
        await new Promise(resolve => setTimeout(resolve, retryDelayMs))
        retryDelayMs = Math.min(retryDelayMs * 2, 30000)
      }
    }
  } else console.warn('MONGO_URI not set; running API without persistence')
  if (mongoose.connection.readyState === 1) {
    await Promise.all([
      Comment.createIndexes(),
      Notification.createIndexes(),
      EquipmentRequest.createIndexes(),
      Report.createIndexes(),
      AuditLog.createIndexes(),
      AdminAccount.createIndexes(),
      Content.createIndexes(),
      ContentView.createIndexes(),
      ShowcaseEvent.createIndexes(),
      WeeklyShowcase.createIndexes(),
      Community.createIndexes(),
      CommunityMessage.createIndexes(),
      CommunityMembershipRequest.createIndexes(),
      MessageAttachment.createIndexes()
    ])
    await ensureDefaultCommunities()
    console.log('Application indexes ready')
    const cleanupAttachments = () => cleanupExpiredMessageAttachments().catch(error => console.error('Expired chat attachment cleanup failed:', error.message))
    await cleanupAttachments()
    const attachmentCleanupTimer = setInterval(cleanupAttachments, 60 * 60 * 1000)
    attachmentCleanupTimer.unref?.()
    scheduleWeeklyShowcaseRefresh(refreshFestivalListings)
    try { await getWeeklySnapshot() }
    catch (error) { console.error('Initial weekly showcase refresh failed:', error.message) }
    try {
      const scan = await refreshFestivalListingsIfDue()
      if (scan.skipped) console.log('Initial festival scan skipped:', scan.reason)
    } catch (error) { console.error('Initial festival opportunity scan failed:', error.message) }
  }
}

start()
