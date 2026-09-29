/**
 * Role-Based Access Control Middleware
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required prior to permission check.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Requires one of [${allowedRoles.join(', ')}] clearance level.`,
      });
    }

    next();
  };
};

/**
 * Base-level authorization middleware.
 * Ensures Base Commanders and Base-assigned officers cannot access or tamper
 * with resources outside their authorized base installation.
 */
const requireBaseAccess = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.',
    });
  }

  // Admins have network-wide multi-base clearance
  if (req.user.role === 'ADMIN') {
    return next();
  }

  const userBaseId = req.user.baseId?._id ? req.user.baseId._id.toString() : req.user.baseId?.toString();

  if (!userBaseId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Account is not assigned to an active military base.',
    });
  }

  // Check query, body, or params for requested baseId
  const requestedBaseId = req.query.baseId || req.body.baseId || req.params.baseId;

  if (requestedBaseId && requestedBaseId.toString() !== userBaseId) {
    return res.status(403).json({
      success: false,
      message: 'Security Violation: You are not authorized to view or mutate assets for a different command installation.',
    });
  }

  // Enforce base scoping automatically if not provided
  if (!req.query.baseId) {
    req.query.baseId = userBaseId;
  }
  if (!req.body.baseId && (req.method === 'POST' || req.method === 'PUT')) {
    req.body.baseId = userBaseId;
  }

  req.baseScope = userBaseId;
  next();
};

module.exports = {
  requireRole,
  requireBaseAccess,
};
