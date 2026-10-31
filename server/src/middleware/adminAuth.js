import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import AdminAccount from '../models/AdminAccount.js'

// Admin uses a separate JWT secret so ordinary user tokens can never access admin endpoints
function adminJwtSecret() {
  const secret = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET
  if (!secret || secret.length < 32) throw Object.assign(new Error('Admin authentication is not configured.'), { status: 503 })
  return secret + ':admin'
}

export function signAdminToken(admin) {
  return jwt.sign({ adminId: admin._id, username: admin.username }, adminJwtSecret(), { expiresIn: '8h' })
}

export async function requireAdmin(req, res, next) {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: 'Admin system temporarily unavailable.' })
    }
    const auth = req.headers.authorization
    if (!auth?.startsWith('Bearer ')) return res.status(401).json({ message: 'Admin authentication required.' })
    const token = auth.slice(7)
    let decoded
    try { decoded = jwt.verify(token, adminJwtSecret()) }
    catch { return res.status(401).json({ message: 'Invalid or expired admin session.' }) }
    if (!decoded.adminId) return res.status(401).json({ message: 'Invalid admin session.' })

    const admin = await AdminAccount.findById(decoded.adminId).select('+failedLoginAttempts +lockedUntil')
    if (!admin || !admin.active) return res.status(401).json({ message: 'Admin account not found.' })

    req.admin = admin
    next()
  } catch (error) { next(error) }
}
