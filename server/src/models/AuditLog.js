import mongoose from 'mongoose'

const auditLogSchema = new mongoose.Schema({
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminAccount', required: true },
  adminUsername: { type: String, required: true },
  action: { type: String, required: true },
  targetType: { type: String, enum: ['user', 'content', 'comment', 'equipment', 'report', 'admin', 'community_membership_request'], required: true },
  targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
  targetLabel: { type: String, default: '' },
  reason: { type: String, maxlength: 1000, default: '' },
  previousStatus: { type: String, default: null },
  newStatus: { type: String, default: null },
  meta: { type: mongoose.Schema.Types.Mixed, default: null }
}, { timestamps: true })

auditLogSchema.index({ adminId: 1, createdAt: -1 })
auditLogSchema.index({ targetType: 1, targetId: 1 })
auditLogSchema.index({ createdAt: -1 })

export default mongoose.model('AuditLog', auditLogSchema)
