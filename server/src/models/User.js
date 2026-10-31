import mongoose from 'mongoose'

const preferencesSchema = new mongoose.Schema({
  primaryIdentity: { type: String, enum: ['cinephile', 'filmmaker'], default: 'cinephile' },
  genres: { type: [String], default: [] },
  filmmakingRoles: { type: [String], default: [] },
  interests: { type: [String], default: [] },
  languages: { type: [String], default: [] },
  sources: {
    primaryIdentity: { type: String, enum: ['selected', 'default'], default: 'default' },
    genres: { type: String, enum: ['selected', 'default'], default: 'default' },
    filmmakingRoles: { type: String, enum: ['selected', 'default'], default: 'default' },
    interests: { type: String, enum: ['selected', 'default'], default: 'default' },
    languages: { type: String, enum: ['selected', 'default'], default: 'default' }
  }
}, { _id: false })

const socialLinksSchema = new mongoose.Schema({
  instagram: { type: String, default: '' },
  youtube: { type: String, default: '' },
  imdb: { type: String, default: '' },
  website: { type: String, default: '' }
}, { _id: false })

const filmTasteItemSchema = new mongoose.Schema({
  id: { type: String, maxlength: 80 },
  title: { type: String, trim: true, maxlength: 140 },
  posterUrl: { type: String, maxlength: 270000 },
  note: { type: String, trim: true, maxlength: 800 }
}, { _id: false })

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  username: { type: String, required: true, unique: true, lowercase: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  roles: [{ type: String, enum: ['director', 'actor', 'cinematographer', 'writer', 'editor', 'producer', 'composer', 'photographer', 'student', 'enthusiast', 'seller', 'admin'] }],
  about: { type: String, default: '' },
  bio: { type: String, default: '' },
  creativeStyle: { type: String, default: '' },
  socialLinks: { type: socialLinksSchema, default: () => ({}) },
  filmTaste: { type: [filmTasteItemSchema], default: [] },
  location: String,
  avatarUrl: String,
  coverUrl: String,
  skills: [String],
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  preferences: { type: preferencesSchema, default: () => ({}) },
  onboardingStatus: { type: String, enum: ['pending', 'completed', 'skipped'], default: 'pending' },
  onboardingSkipped: { type: Boolean, default: false },
  // New accounts explicitly start unseen. Older completed accounts infer seen=true in publicUser.
  cinematicIntroSeen: { type: Boolean },
  passwordResetTokenHash: { type: String, select: false },
  passwordResetExpiresAt: { type: Date, select: false },
  accountStatus: { type: String, enum: ['active', 'suspended', 'banned'], default: 'active', index: true },
  suspendedAt: { type: Date, default: null },
  suspendedReason: { type: String, default: '' },
  suspendedUntil: { type: Date, default: null },
  bannedAt: { type: Date, default: null },
  bannedReason: { type: String, default: '' }
}, { timestamps: true })

export default mongoose.model('User', userSchema)
