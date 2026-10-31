import AuditLog from '../models/AuditLog.js'

/**
 * Record an admin action in the audit log.
 * Never throws — audit failures are logged to console but don't break the main operation.
 */
export async function recordAudit(admin, { action, targetType, targetId, targetLabel = '', reason = '', previousStatus = null, newStatus = null, meta = null }) {
  try {
    await AuditLog.create({
      adminId: admin._id,
      adminUsername: admin.username,
      action,
      targetType,
      targetId,
      targetLabel,
      reason,
      previousStatus,
      newStatus,
      meta
    })
  } catch (error) {
    console.error('Audit log write failed:', error.message)
  }
}
