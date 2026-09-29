const { AuditLog } = require('../models');

class AuditService {
  /**
   * Log any operational mutation in MongoDB with before/after state
   */
  async log({
    req = null,
    userId = null,
    userName = 'System',
    role = 'SYSTEM',
    action,
    entityType,
    entityId = null,
    baseId = null,
    before = null,
    after = null,
    ipAddress = '127.0.0.1',
    userAgent = 'Terminal',
    status = 'SUCCESS',
    notes = '',
  }) {
    try {
      const finalUserId = req?.user?._id || userId;
      const finalUserName = req?.user?.fullName || userName;
      const finalRole = req?.user?.role || role;
      const finalIp = req?.ip || req?.connection?.remoteAddress || ipAddress;
      const finalUserAgent = req?.headers?.['user-agent'] || userAgent;

      const logEntry = new AuditLog({
        userId: finalUserId,
        userName: finalUserName,
        role: finalRole,
        action,
        entityType,
        entityId: entityId ? entityId.toString() : null,
        baseId: baseId || req?.user?.baseId?._id || req?.user?.baseId || null,
        before: before ? JSON.parse(JSON.stringify(before)) : null,
        after: after ? JSON.parse(JSON.stringify(after)) : null,
        ipAddress: finalIp,
        userAgent: finalUserAgent,
        status,
        notes,
      });

      return await logEntry.save();
    } catch (error) {
      console.error('[AuditService Error] Failed to persist audit log:', error.message);
      // Do not crash main request if audit logging fails
      return null;
    }
  }
}

module.exports = new AuditService();
