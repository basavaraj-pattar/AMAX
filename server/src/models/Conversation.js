import mongoose from 'mongoose'

const participantSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  joinedAt: { type: Date, default: Date.now },
  lastReadAt: { type: Date, default: new Date(0) }
}, { _id: false })

const conversationSchema = new mongoose.Schema({
  type: { type: String, enum: ['direct'], default: 'direct', immutable: true },
  participants: {
    type: [participantSchema],
    validate: {
      validator: participants => participants.length === 2 && new Set(participants.map(item => String(item.user))).size === 2,
      message: 'A direct conversation must have two different participants.'
    },
    required: true
  },
  participantKey: { type: String, required: true, unique: true },
  lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null },
  lastActivityAt: { type: Date, default: Date.now, index: true }
}, { timestamps: true })

conversationSchema.index({ 'participants.user': 1, lastActivityAt: -1 })

export default mongoose.model('Conversation', conversationSchema)
