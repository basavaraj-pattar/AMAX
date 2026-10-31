import mongoose from 'mongoose'

const communitySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  slug: { type: String, trim: true, lowercase: true, index: { unique: true, sparse: true } },
  description: { type: String, trim: true, maxlength: 500 },
  coverUrl: { type: String, default: '' },
  membersCountBase: { type: Number, default: 0, min: 0 },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  moderators: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  channels: [{
    name: { type: String, required: true, trim: true, maxlength: 40 },
    slug: { type: String, required: true, trim: true, lowercase: true, maxlength: 48 },
    description: { type: String, trim: true, maxlength: 180, default: '' }
  }],
  lastActivityAt: { type: Date, default: Date.now, index: true },
  systemManaged: { type: Boolean, default: false }
}, { timestamps: true })

communitySchema.index({ members: 1, lastActivityAt: -1 })

export default mongoose.model('Community', communitySchema)
