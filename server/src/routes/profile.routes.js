import { Router } from 'express'
import mongoose from 'mongoose'
import User from '../models/User.js'
import Content from '../models/Content.js'
import EquipmentListing from '../models/EquipmentListing.js'

export function publicFilmmakerProfile(user) {
  const role = user.preferences?.filmmakingRoles?.length
    ? user.preferences.filmmakingRoles.join(' · ')
    : user.roles?.filter(value => value !== 'enthusiast').map(value =>
      value.replace(/(^|-)([a-z])/g, (_match, separator, letter) => `${separator === '-' ? ' ' : ''}${letter.toUpperCase()}`)
    ).join(' · ') || 'Filmmaker'
  return {
    id: String(user._id),
    name: user.name,
    username: user.username,
    role,
    image: user.avatarUrl || `https://i.pravatar.cc/160?u=${encodeURIComponent(user.username)}`,
    coverImage: user.coverUrl || '',
    about: user.about || '',
    bio: user.bio || '',
    creativeStyle: user.creativeStyle || '',
    socialLinks: user.socialLinks || {},
    filmTaste: Array.isArray(user.filmTaste) ? user.filmTaste : [],
    location: user.location || '',
    skills: Array.isArray(user.skills) ? user.skills : [],
    followers: Array.isArray(user.followers) ? user.followers.length : 0
  }
}

const router = Router()

function contributorRole(user) {
  if (user.preferences?.filmmakingRoles?.length) return user.preferences.filmmakingRoles.join(' · ')
  const roles = (user.roles || []).filter(value => value !== 'enthusiast').map(value =>
    value.replace(/(^|-)([a-z])/g, (_match, separator, letter) => `${separator === '-' ? ' ' : ''}${letter.toUpperCase()}`)
  )
  if (roles.length) return roles.join(' · ')
  return user.preferences?.primaryIdentity === 'filmmaker' ? 'Filmmaker' : 'Film community'
}

function contributorCard(user, activity = {}) {
  const filmCount = activity.filmCount || 0
  const scriptCount = activity.scriptCount || 0
  const equipmentCount = activity.equipmentCount || 0
  return {
    id: String(user._id),
    name: user.name,
    username: user.username,
    role: contributorRole(user),
    image: user.avatarUrl || `https://i.pravatar.cc/160?u=${encodeURIComponent(user.username)}`,
    contributionCount: filmCount + scriptCount + equipmentCount,
    contributions: { films: filmCount, scripts: scriptCount, equipment: equipmentCount },
    lastContributionAt: activity.lastContributionAt || null
  }
}

// The rolling seven-day window is calculated on every request. The homepage
// caches this compact public leaderboard and refreshes it once a day.
router.get('/contributors', async (_req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ message: 'Contributor profiles are temporarily unavailable.' })
  }
  try {
    const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const [contentActivity, equipmentActivity] = await Promise.all([
      Content.aggregate([
        { $match: { createdAt: { $gte: weekStart }, moderationStatus: 'published', type: { $in: ['film', 'script', 'story'] } } },
        { $group: {
          _id: '$creator',
          filmCount: { $sum: { $cond: [{ $eq: ['$type', 'film'] }, 1, 0] } },
          scriptCount: { $sum: { $cond: [{ $in: ['$type', ['script', 'story']] }, 1, 0] } },
          lastContributionAt: { $max: '$createdAt' }
        } }
      ]),
      EquipmentListing.aggregate([
        { $match: { createdAt: { $gte: weekStart } } },
        { $group: { _id: '$seller', equipmentCount: { $sum: 1 }, lastContributionAt: { $max: '$createdAt' } } }
      ])
    ])

    const activityByUser = new Map()
    for (const row of contentActivity) {
      if (!row._id) continue
      activityByUser.set(String(row._id), {
        filmCount: row.filmCount || 0,
        scriptCount: row.scriptCount || 0,
        equipmentCount: 0,
        lastContributionAt: row.lastContributionAt || null
      })
    }
    for (const row of equipmentActivity) {
      if (!row._id) continue
      const key = String(row._id)
      const activity = activityByUser.get(key) || { filmCount: 0, scriptCount: 0, equipmentCount: 0, lastContributionAt: null }
      activity.equipmentCount = row.equipmentCount || 0
      if (!activity.lastContributionAt || row.lastContributionAt > activity.lastContributionAt) {
        activity.lastContributionAt = row.lastContributionAt
      }
      activityByUser.set(key, activity)
    }

    const contributorIds = [...activityByUser.keys()].filter(mongoose.isValidObjectId)
    const users = await User.find({
      accountStatus: 'active',
      $or: [
        { _id: { $in: contributorIds } },
        { 'preferences.primaryIdentity': 'filmmaker' }
      ]
    })
      .select('name username avatarUrl roles preferences.primaryIdentity preferences.filmmakingRoles')
      .sort({ name: 1, _id: 1 })
      .lean()

    let fillerUsers = users.filter(user => user.preferences?.primaryIdentity === 'filmmaker')
    if (users.length < 10) {
      const knownIds = users.map(user => user._id)
      const additionalUsers = await User.find({ accountStatus: 'active', _id: { $nin: knownIds } })
        .select('name username avatarUrl roles preferences.primaryIdentity preferences.filmmakingRoles')
        .sort({ createdAt: -1, _id: 1 })
        .limit(10 - users.length)
        .lean()
      fillerUsers = [...fillerUsers, ...additionalUsers]
    }

    const weeklyContributors = users
      .filter(user => activityByUser.has(String(user._id)))
      .map(user => contributorCard(user, activityByUser.get(String(user._id))))
      .sort((a, b) => b.contributionCount - a.contributionCount
        || new Date(b.lastContributionAt || 0) - new Date(a.lastContributionAt || 0)
        || a.name.localeCompare(b.name))

    // If fewer than ten people posted this week, fill the remaining rail with
    // real active filmmaker profiles first, then other active community profiles.
    const weeklyIds = new Set(weeklyContributors.map(profile => profile.id))
    const fallbackUsers = [...fillerUsers, ...users.filter(user => user.preferences?.primaryIdentity !== 'filmmaker')]
    const filmmakerProfiles = fallbackUsers
      .filter((user, index, list) => !weeklyIds.has(String(user._id)) && list.findIndex(candidate => String(candidate._id) === String(user._id)) === index)
      .map(user => contributorCard(user))
    res.json([...weeklyContributors, ...filmmakerProfiles].slice(0, 10))
  } catch (error) {
    next(error)
  }
})

router.get('/filmmakers', async (_req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ message: 'Filmmaker profiles are temporarily unavailable.' })
  }
  try {
    const users = await User.find({ 'preferences.primaryIdentity': 'filmmaker' })
      .select('name username roles avatarUrl coverUrl about bio creativeStyle socialLinks filmTaste location skills followers preferences.filmmakingRoles')
      .sort({ name: 1, _id: 1 })
      .lean()
    res.json(users.map(publicFilmmakerProfile))
  } catch (error) {
    next(error)
  }
})

router.get('/users', async (req, res, next) => {
  const usernames = typeof req.query.usernames === 'string'
    ? [...new Set(req.query.usernames.split(',').map(value => value.trim().replace(/^@/, '').toLowerCase()).filter(Boolean))]
    : []
  if (!usernames.length) return res.json([])
  if (usernames.length > 30 || usernames.some(username => !/^[a-z0-9][a-z0-9_-]{1,29}$/.test(username))) {
    return res.status(400).json({ message: 'Enter valid AMAX usernames for the film crew.' })
  }
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ message: 'Crew profiles are temporarily unavailable.' })
  }
  try {
    const users = await User.find({ username: { $in: usernames } })
      .select('name username avatarUrl')
      .lean()
    res.json(users.map(user => ({
      name: user.name,
      username: user.username,
      image: user.avatarUrl || `https://i.pravatar.cc/160?u=${encodeURIComponent(user.username)}`
    })))
  } catch (error) {
    next(error)
  }
})

export default router
