import mongoose from 'mongoose'

const adminAccountSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  displayName: { type: String, required: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  mustChangePassword: { type: Boolean, default: true },
  failedLoginAttempts: { type: Number, default: 0, select: false },
  lockedUntil: { type: Date, default: null, select: false },
  lastLoginAt: { type: Date, default: null },
  active: { type: Boolean, default: true }
}, { timestamps: true })

export default mongoose.model('AdminAccount', adminAccountSchema)
