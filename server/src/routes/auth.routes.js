import { Router } from 'express'
import bcrypt from 'bcryptjs'
import crypto from 'node:crypto'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import nodemailer from 'nodemailer'
import { OAuth2Client } from 'google-auth-library'
import User from '../models/User.js'
import { protect } from '../middleware/auth.js'
import { mergePreferences, preferenceKeys } from '../services/preferences.js'
import { runtimeConfig } from '../config/runtime.js'

const router = Router()
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
const apiClientUrl = runtimeConfig.clientAppUrl

function authTokenFor(user) {
  if (!process.env.JWT_SECRET) {
    const error = new Error('Authentication is not configured. Set JWT_SECRET in server/.env.')
    error.status = 503
    throw error
  }
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' })
}

function authenticationUnavailable(res) {
  if (mongoose.connection.readyState !== 1) {
    res.status(503).json({ message: 'Sign-up and sign-in are temporarily unavailable because MongoDB is not connected. Set MONGO_URI in server/.env and start MongoDB.' })
    return true
  }
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    res.status(503).json({ message: 'Sign-up and sign-in are not configured. Set JWT_SECRET to a unique value of at least 32 characters in server/.env.' })
    return true
  }
  return false
}

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    username: user.username,
    email: user.email,
    avatarUrl: user.avatarUrl || '',
    coverUrl: user.coverUrl || '',
    about: user.about || '',
    bio: user.bio || '',
    location: user.location || '',
    creativeStyle: user.creativeStyle || '',
    socialLinks: user.socialLinks || {},
    filmTaste: user.filmTaste || [],
    skills: user.skills || [],
    roles: user.roles,
    preferences: user.preferences,
    onboardingStatus: user.onboardingStatus,
    onboardingSkipped: user.onboardingSkipped,
    cinematicIntroSeen: user.onboardingStatus === 'pending'
      ? false
      : user.cinematicIntroSeen == null ? true : user.cinematicIntroSeen
  }
}

function authResponse(user) {
  return { token: authTokenFor(user), user: publicUser(user) }
}

function normalizeEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254
}

function newUsername(name) {
  const stem = (name || 'amax-creator').toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 18) || 'amaxcreator'
  return `${stem}${crypto.randomBytes(3).toString('hex')}`
}

function smtpTransport() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD } = process.env
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASSWORD) {
    const error = new Error('Password reset email is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, and SMTP_FROM in server/.env.')
    error.status = 503
    throw error
  }
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASSWORD }
  })
}

router.post('/register', async (req, res, next) => {
  try {
    if (authenticationUnavailable(res)) return
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : ''
    const email = normalizeEmail(req.body.email)
    const password = typeof req.body.password === 'string' ? req.body.password : ''
    const username = typeof req.body.username === 'string' && req.body.username.trim()
      ? req.body.username.trim().toLowerCase()
      : newUsername(name)

    if (name.length < 2 || name.length > 80 || !validEmail(email) || password.length < 8 || password.length > 128) {
      return res.status(400).json({ message: 'Enter a name, valid email, and password between 8 and 128 characters.' })
    }
    if (!/^[a-z0-9][a-z0-9_-]{2,29}$/.test(username)) {
      return res.status(400).json({ message: 'Username must be 3–30 characters using letters, numbers, underscores, or hyphens.' })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const user = await User.create({ name, username, email, passwordHash, roles: ['enthusiast'], cinematicIntroSeen: false })
    res.status(201).json(authResponse(user))
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'That email or username is already registered.' })
    next(error)
  }
})

router.post('/login', async (req, res, next) => {
  try {
    if (authenticationUnavailable(res)) return
    const suppliedIdentifier = req.body.identifier ?? req.body.email
    const identifier = typeof suppliedIdentifier === 'string' ? suppliedIdentifier.trim().toLowerCase() : ''
    const email = normalizeEmail(identifier)
    const username = identifier.startsWith('@') ? identifier.slice(1) : identifier
    const isUsername = /^[a-z0-9][a-z0-9_-]{2,29}$/.test(username)
    const user = validEmail(email)
      ? await User.findOne({ email })
      : isUsername ? await User.findOne({ username }) : null
    if (!user || !(await bcrypt.compare(req.body.password || '', user.passwordHash))) {
      return res.status(401).json({ message: 'Invalid email or username, or password.' })
    }
    res.json(authResponse(user))
  } catch (error) { next(error) }
})

router.post('/google', async (req, res, next) => {
  try {
    if (authenticationUnavailable(res)) return
    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(503).json({ message: 'Google sign-in is not configured. Set GOOGLE_CLIENT_ID in server/.env.' })
    }
    if (typeof req.body.credential !== 'string' || !req.body.credential) {
      return res.status(400).json({ message: 'A Google credential is required.' })
    }
    const ticket = await googleClient.verifyIdToken({ idToken: req.body.credential, audience: process.env.GOOGLE_CLIENT_ID })
    const profile = ticket.getPayload()
    if (!profile?.email || !profile.email_verified) return res.status(401).json({ message: 'Verified Google email is required.' })

    const email = normalizeEmail(profile.email)
    let user = await User.findOne({ email })
    if (!user) {
      user = await User.create({
        name: profile.name || email.split('@')[0],
        username: newUsername(profile.name || email.split('@')[0]),
        email,
        passwordHash: await bcrypt.hash(crypto.randomUUID(), 12),
        avatarUrl: profile.picture,
        roles: ['enthusiast'],
        cinematicIntroSeen: false
      })
    }
    res.json(authResponse(user))
  } catch (error) { next(error) }
})

router.get('/me', protect, (req, res) => res.json(publicUser(req.user)))

router.post('/me/cinematic-intro/complete', protect, async (req, res, next) => {
  try {
    if (req.user.onboardingStatus === 'pending') {
      return res.status(409).json({ message: 'Complete onboarding before finishing the cinematic introduction.' })
    }
    req.user.cinematicIntroSeen = true
    await req.user.save()
    res.json(publicUser(req.user))
  } catch (error) { next(error) }
})

router.put('/me/profile', protect, async (req, res, next) => {
  try {
    if (Object.hasOwn(req.body, 'name')) {
      const name = typeof req.body.name === 'string' ? req.body.name.trim() : ''
      if (name.length < 2 || name.length > 80) return res.status(400).json({ message: 'Name must be between 2 and 80 characters.' })
      req.user.name = name
    }
    if (Object.hasOwn(req.body, 'avatarUrl')) {
      const avatarUrl = typeof req.body.avatarUrl === 'string' ? req.body.avatarUrl : ''
      const isHttpsUrl = (() => {
        try { return new URL(avatarUrl).protocol === 'https:' } catch { return false }
      })()
      if (avatarUrl.length > 1_500_000 || (avatarUrl && !isHttpsUrl && !/^data:image\/(png|jpeg);base64,/.test(avatarUrl))) {
        return res.status(400).json({ message: 'Profile photo must be a secure URL or a PNG/JPEG image under 1.5 MB.' })
      }
      req.user.avatarUrl = avatarUrl
    }
    if (Object.hasOwn(req.body, 'coverUrl')) {
      const coverUrl = typeof req.body.coverUrl === 'string' ? req.body.coverUrl : ''
      const isHttpsUrl = (() => {
        try { return new URL(coverUrl).protocol === 'https:' } catch { return false }
      })()
      if (coverUrl.length > 1_500_000 || (coverUrl && !isHttpsUrl && !/^data:image\/(png|jpeg);base64,/.test(coverUrl))) {
        return res.status(400).json({ message: 'Profile background must be a secure URL or a compressed PNG/JPEG image under 1.5 MB.' })
      }
      req.user.coverUrl = coverUrl
    }
    if (Object.hasOwn(req.body, 'about')) {
      const about = typeof req.body.about === 'string' ? req.body.about.trim() : ''
      if (about.length > 3000) return res.status(400).json({ message: 'About text must be 3,000 characters or fewer.' })
      req.user.about = about
    }
    if (Object.hasOwn(req.body, 'bio')) {
      const bio = typeof req.body.bio === 'string' ? req.body.bio.trim() : ''
      if (bio.length > 1200) return res.status(400).json({ message: 'Biography must be 1,200 characters or fewer.' })
      req.user.bio = bio
    }
    if (Object.hasOwn(req.body, 'location')) {
      const location = typeof req.body.location === 'string' ? req.body.location.trim() : ''
      if (location.length > 120) return res.status(400).json({ message: 'Location must be 120 characters or fewer.' })
      req.user.location = location
    }
    if (Object.hasOwn(req.body, 'creativeStyle')) {
      const creativeStyle = typeof req.body.creativeStyle === 'string' ? req.body.creativeStyle.trim() : ''
      if (creativeStyle.length > 1000) return res.status(400).json({ message: 'Creative style must be 1,000 characters or fewer.' })
      req.user.creativeStyle = creativeStyle
    }
    if (Object.hasOwn(req.body, 'skills')) {
      if (!Array.isArray(req.body.skills) || req.body.skills.length > 12) {
        return res.status(400).json({ message: 'Choose up to 12 professional fields.' })
      }
      const skills = []
      for (const skill of req.body.skills) {
        if (typeof skill !== 'string' || skill.trim().length > 60) {
          return res.status(400).json({ message: 'Each professional field must be 60 characters or fewer.' })
        }
        const normalized = skill.trim()
        if (normalized && !skills.some(existing => existing.toLowerCase() === normalized.toLowerCase())) skills.push(normalized)
      }
      req.user.skills = skills
    }
    if (Object.hasOwn(req.body, 'socialLinks')) {
      const suppliedLinks = req.body.socialLinks
      if (!suppliedLinks || typeof suppliedLinks !== 'object' || Array.isArray(suppliedLinks)) {
        return res.status(400).json({ message: 'Profile links must be provided as a platform-to-URL object.' })
      }
      const platforms = ['instagram', 'youtube', 'imdb', 'website']
      const links = {}
      for (const platform of platforms) {
        const value = suppliedLinks[platform] == null ? '' : suppliedLinks[platform]
        if (typeof value !== 'string' || value.length > 500) {
          return res.status(400).json({ message: `${platform} profile URL must be 500 characters or fewer.` })
        }
        const trimmed = value.trim()
        if (!trimmed) {
          links[platform] = ''
          continue
        }
        let parsed
        try { parsed = new URL(trimmed) } catch { return res.status(400).json({ message: `Enter a valid HTTPS ${platform} profile URL.` }) }
        if (parsed.protocol !== 'https:') return res.status(400).json({ message: `${platform} profile links must use HTTPS.` })
        const host = parsed.hostname.toLowerCase()
        const allowedDomains = {
          instagram: ['instagram.com'],
          youtube: ['youtube.com', 'youtu.be'],
          imdb: ['imdb.com'],
          website: []
        }[platform]
        if (allowedDomains.length && !allowedDomains.some(domain => host === domain || host.endsWith(`.${domain}`))) {
          return res.status(400).json({ message: `Use an official ${platform} profile URL.` })
        }
        links[platform] = parsed.href
      }
      req.user.socialLinks = links
    }
    if (Object.hasOwn(req.body, 'filmTaste')) {
      if (!Array.isArray(req.body.filmTaste) || req.body.filmTaste.length > 6) {
        return res.status(400).json({ message: 'Cinematic DNA can include up to six films.' })
      }
      let totalPosterCharacters = 0
      const filmTaste = []
      for (const [index, item] of req.body.filmTaste.entries()) {
        if (!item || typeof item !== 'object' || Array.isArray(item)) {
          return res.status(400).json({ message: 'Each film selection must include a title, poster, and note.' })
        }
        const id = typeof item.id === 'string' ? item.id.trim() : `taste-${index + 1}`
        const title = typeof item.title === 'string' ? item.title.trim() : ''
        const note = typeof item.note === 'string' ? item.note.trim() : ''
        const posterUrl = typeof item.posterUrl === 'string' ? item.posterUrl : ''
        if (!id || id.length > 80 || !title || title.length > 140 || !note || note.length > 800) {
          return res.status(400).json({ message: 'Each film needs a title (up to 140 characters) and a note (up to 800 characters).' })
        }
        if (posterUrl.length > 270_000 || !/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(posterUrl)) {
          return res.status(400).json({ message: 'Upload a compressed JPEG poster for each film selection.' })
        }
        totalPosterCharacters += posterUrl.length
        if (totalPosterCharacters > 1_500_000) {
          return res.status(400).json({ message: 'The selected posters are too large. Choose smaller images.' })
        }
        filmTaste.push({ id, title, posterUrl, note })
      }
      req.user.filmTaste = filmTaste
    }
    await req.user.save()
    res.json(publicUser(req.user))
  } catch (error) { next(error) }
})

router.put('/me/preferences', protect, async (req, res, next) => {
  try {
    const { values = {}, skippedStep, skipAll = false, complete = false } = req.body
    const firstOnboardingCompletion = req.user.onboardingStatus === 'pending'
    req.user.preferences.set(mergePreferences(req.user.preferences, values, { skippedStep, skipAll }))
    if (complete || skipAll) {
      req.user.onboardingStatus = skipAll ? 'skipped' : 'completed'
      req.user.onboardingSkipped = Boolean(skipAll)
      if (firstOnboardingCompletion) req.user.cinematicIntroSeen = false
    }

    await req.user.save()
    res.json(publicUser(req.user))
  } catch (error) { next(error) }
})

router.post('/forgot-password', async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Password reset is temporarily unavailable because MongoDB is not connected. Set MONGO_URI in server/.env and start MongoDB.' })
    }
    const transport = smtpTransport()
    const email = normalizeEmail(req.body.email)
    if (!validEmail(email)) return res.status(400).json({ message: 'Enter a valid email address.' })
    const user = await User.findOne({ email })
    if (user) {
      const token = crypto.randomBytes(32).toString('hex')
      user.passwordResetTokenHash = crypto.createHash('sha256').update(token).digest('hex')
      user.passwordResetExpiresAt = new Date(Date.now() + 60 * 60 * 1000)
      await user.save()
      const resetUrl = `${apiClientUrl}/reset-password?token=${token}`
      await transport.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: user.email,
        subject: 'Reset your A-MAX password',
        text: `Use this link within one hour to reset your A-MAX password: ${resetUrl}`,
        html: `<p>Use this link within one hour to reset your A-MAX password:</p><p><a href="${resetUrl}">Reset password</a></p>`
      })
    }
    res.json({ message: 'If an account exists for that email, a password reset link has been sent.' })
  } catch (error) { next(error) }
})

router.post('/reset-password', async (req, res, next) => {
  try {
    const { token, password } = req.body
    if (typeof token !== 'string' || token.length !== 64 || typeof password !== 'string' || password.length < 8 || password.length > 128) {
      return res.status(400).json({ message: 'Use a valid reset link and a password between 8 and 128 characters.' })
    }
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
    const user = await User.findOne({
      passwordResetTokenHash: tokenHash,
      passwordResetExpiresAt: { $gt: new Date() }
    }).select('+passwordResetTokenHash +passwordResetExpiresAt')
    if (!user) return res.status(400).json({ message: 'This password reset link is invalid or has expired.' })
    user.passwordHash = await bcrypt.hash(password, 12)
    user.passwordResetTokenHash = undefined
    user.passwordResetExpiresAt = undefined
    await user.save()
    res.json({ message: 'Your password has been reset. You can now sign in.' })
  } catch (error) { next(error) }
})

export default router
