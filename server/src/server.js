import 'dotenv/config'
import dns from 'node:dns'
import express from 'express'
import cors from 'cors'
import http from 'http'
import { Server } from 'socket.io'
import mongoose from 'mongoose'
import { access, constants, mkdir } from 'node:fs/promises'
import jwt from 'jsonwebtoken'
import User from './models/User.js'
import Conversation from './models/Conversation.js'
import Message from './models/Message.js'
import EquipmentListing from './models/EquipmentListing.js'
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
import filmUploadRoutes from './routes/film-upload.routes.js'
import notificationRoutes from './routes/notification.routes.js'
import Comment from './models/Comment.js'
import Notification from './models/Notification.js'
import scriptUploadRoutes from './routes/script-upload.routes.js'
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
import { runtimeConfig } from './config/runtime.js'
import { filmVideoDirectory, messageAttachmentDirectory, scriptDocumentDirectory } from './config/storage.js'

const configuredDnsServers = process.env.MONGODB_DNS_SERVERS
  ?.split(',')
  .map(server => server.trim())
  .filter(Boolean)
if (configuredDnsServers?.length) dns.setServers(configuredDnsServers)

const app = express()
const server = http.createServer(app)
const localDevelopmentUrls = runtimeConfig.production ? [] : [
  'http://localhost:5174',
  'http://localhost:5175',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5175'
]
const allowedClientOrigins = [...new Set([...runtimeConfig.clientOrigins, ...localDevelopmentUrls])]
const isAllowedClientOrigin = origin => !origin || allowedClientOrigins.includes(origin)
const corsOrigin = (origin, callback) => {
  const allowed = isAllowedClientOrigin(origin)
  callback(allowed ? null : Object.assign(new Error('Origin is not allowed by CORS.'), { status: 403 }), allowed)
}
const io = new Server(server, { cors: { origin: allowedClientOrigins, methods: ['GET', 'POST'] } })
const port = runtimeConfig.port
const shutdownController = new AbortController()
let applicationReady = false
let attachmentCleanupTimer
let stopShowcaseRefresh
let shutdownPromise

app.use(cors({ origin: corsOrigin, methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], allowedHeaders: ['Content-Type', 'Authorization', 'X-File-Name'] }))
app.use(express.json({ limit: '2mb' }))
app.get('/api/health', (_req, res) => {
  const databaseConnected = mongoose.connection.readyState === 1
  const ready = applicationReady && (!runtimeConfig.mongoUri || databaseConnected)
  res.status(ready ? 200 : 503).json({
    name: 'A-MAX API',
    status: ready ? 'online' : 'starting',
    database: runtimeConfig.mongoUri ? (databaseConnected ? 'connected' : 'connecting') : 'disabled',
    timestamp: new Date().toISOString()
  })
})
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

function waitForRetry(delayMs, signal) {
  return new Promise(resolve => {
    let timer
    const finish = () => {
      clearTimeout(timer)
      signal.removeEventListener('abort', finish)
      resolve()
    }
    timer = setTimeout(finish, delayMs)
    signal.addEventListener('abort', finish, { once: true })
  })
}

async function connectToDatabase() {
  let retryDelayMs = 1000
  while (!shutdownController.signal.aborted) {
    try {
      await mongoose.connect(runtimeConfig.mongoUri, {
        serverSelectionTimeoutMS: 5000,
        autoIndex: false
      })
      console.log('MongoDB connected')
      return true
    } catch (error) {
      if (shutdownController.signal.aborted) return false
      console.warn(`MongoDB unavailable; retrying: ${error.message}`)
      await waitForRetry(retryDelayMs, shutdownController.signal)
      retryDelayMs = Math.min(retryDelayMs * 2, 30000)
    }
  }
  return false
}

async function initializePersistence() {
  const connected = await connectToDatabase()
  if (!connected || shutdownController.signal.aborted) return

  await Promise.all([
    Comment.createIndexes(),
    Notification.createIndexes(),
    EquipmentRequest.createIndexes(),
    Report.createIndexes(),
    AuditLog.createIndexes(),
    AdminAccount.createIndexes(),
    User.createIndexes(),
    Conversation.createIndexes(),
    Message.createIndexes(),
    EquipmentListing.createIndexes(),
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
  for (const directory of [filmVideoDirectory, scriptDocumentDirectory, messageAttachmentDirectory]) {
    await mkdir(directory, { recursive: true })
    await access(directory, constants.W_OK)
  }
  console.log('Application indexes and persistent storage ready')

  const cleanupAttachments = () => cleanupExpiredMessageAttachments()
    .catch(error => console.error('Expired chat attachment cleanup failed:', error))
  await cleanupAttachments()
  attachmentCleanupTimer = setInterval(cleanupAttachments, 60 * 60 * 1000)
  attachmentCleanupTimer.unref?.()
  stopShowcaseRefresh = scheduleWeeklyShowcaseRefresh(refreshFestivalListings)
  applicationReady = true

  void getWeeklySnapshot().catch(error => console.error('Initial weekly showcase refresh failed:', error.message))
  void refreshFestivalListingsIfDue()
    .then(scan => {
      if (scan.skipped) console.log('Initial festival scan skipped:', scan.reason)
    })
    .catch(error => console.error('Initial festival opportunity scan failed:', error.message))
}

async function shutdown() {
  if (shutdownPromise) return shutdownPromise
  shutdownController.abort()
  applicationReady = false
  if (attachmentCleanupTimer) clearInterval(attachmentCleanupTimer)
  stopShowcaseRefresh?.()
  shutdownPromise = (async () => {
    await new Promise(resolve => io.close(resolve))
    await mongoose.disconnect()
  })()
  return shutdownPromise
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => {
    console.log(`Received ${signal}; shutting down gracefully`)
    shutdown()
      .then(() => { if (process.exitCode === undefined) process.exitCode = 0 })
      .catch(error => {
        console.error('Graceful shutdown failed:', error)
        process.exitCode = 1
      })
  })
}

async function start() {
  await new Promise((resolve, reject) => {
    const onError = error => {
      server.off('listening', onListening)
      reject(error)
    }
    const onListening = () => {
      server.off('error', onError)
      resolve()
    }
    server.once('error', onError)
    server.once('listening', onListening)
    server.listen(port, '0.0.0.0')
  })
  console.log(`A-MAX API listening on port ${port}`)

  if (!runtimeConfig.mongoUri) {
    console.warn('MONGO_URI not set; running API without persistence')
    applicationReady = true
    return
  }
  await initializePersistence()
}

start().catch(async error => {
  console.error('API startup failed:', error)
  process.exitCode = 1
  try { await shutdown() }
  catch (shutdownError) {
    console.error('API shutdown after startup failure failed:', shutdownError)
  }
})
