import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import User from '../models/User.js'

export async function protect(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ message: 'Authentication required.' })
  if (mongoose.connection.readyState !== 1) return res.status(503).json({ message: 'Account storage is unavailable because MongoDB is not connected. Set MONGO_URI in server/.env and start MongoDB.' })
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) return res.status(503).json({ message: 'Authentication is not configured. Set JWT_SECRET to a unique value of at least 32 characters in server/.env.' })
  let decoded
  try { decoded = jwt.verify(token, process.env.JWT_SECRET) }
  catch { return res.status(401).json({ message: 'Invalid or expired token.' }) }
  try {
    req.user = await User.findById(decoded.id).select('-passwordHash -passwordResetTokenHash -passwordResetExpiresAt')
    if (!req.user) return res.status(401).json({ message: 'User not found.' })
    if (req.user.accountStatus === 'banned') return res.status(403).json({ message: 'Your account has been permanently suspended.' })
    if (req.user.accountStatus === 'suspended') {
      if (req.user.suspendedUntil && req.user.suspendedUntil <= new Date()) {
        // Suspension expired — auto-restore
        await User.updateOne({ _id: req.user._id }, { $set: { accountStatus: 'active', suspendedAt: null, suspendedReason: '', suspendedUntil: null } })
        req.user.accountStatus = 'active'
      } else {
        return res.status(403).json({ message: 'Your account has been temporarily suspended.' })
      }
    }
    next()
  } catch (error) { next(error) }
}

export async function optionalProtect(req, res, next) {
  const authorization = req.headers.authorization
  if (!authorization) return next()
  const token = authorization.replace(/^Bearer\s+/i, '')
  if (!token || mongoose.connection.readyState !== 1) return res.status(401).json({ message: 'Invalid or unavailable session.' })
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) return res.status(503).json({ message: 'Authentication is not configured.' })
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = await User.findById(decoded.id).select('-passwordHash -passwordResetTokenHash -passwordResetExpiresAt')
    if (!req.user) return res.status(401).json({ message: 'User not found.' })
    next()
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') return res.status(401).json({ message: 'Invalid or expired token.' })
    next(error)
  }
}

export function authorize(...roles) { return (req, res, next) => roles.some(role => req.user?.roles.includes(role)) ? next() : res.status(403).json({ message: 'Insufficient permissions.' }) }