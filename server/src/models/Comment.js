import mongoose from 'mongoose'

const commentSchema = new mongoose.Schema({
  content: { type: mongoose.Schema.Types.ObjectId, ref: 'Content', required: true, index: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null },
  clientRequestId: { type: String },
  body: { type: String, required: true, trim: true, maxlength: 1000 }
}, { timestamps: true })

commentSchema.index({ content: 1, parent: 1, createdAt: -1 })
commentSchema.index(
  { author: 1, clientRequestId: 1 },
  { unique: true, partialFilterExpression: { clientRequestId: { $type: 'string' } } }
)

export default mongoose.model('Comment', commentSchema)
