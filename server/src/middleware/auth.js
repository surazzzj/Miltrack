const jwt = require('jsonwebtoken');
const { User } = require('../models');

const requireAuth = async (req, res, next) => {
  try {
    let token = null;

    // Check Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      // Check HTTP-only cookie
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No access token provided.',
      });
    }

    const secret = process.env.JWT_SECRET || 'miltrack_super_secret_jwt_key_operational_security_2025';
    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired access token. Please re-authenticate.',
      });
    }

    const user = await User.findById(decoded.id).select('-passwordHash').populate('baseId');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User account no longer exists.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'User account has been deactivated. Contact your administrator.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { requireAuth };
