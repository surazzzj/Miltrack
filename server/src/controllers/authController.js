const jwt = require('jsonwebtoken');
const { User } = require('../models');
const auditService = require('../services/auditService');

const generateToken = (user) => {
  const secret = process.env.JWT_SECRET || 'miltrack_super_secret_jwt_key_operational_security_2025';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      baseId: user.baseId?._id || user.baseId,
    },
    secret,
    { expiresIn }
  );
};

const sendTokenResponse = (user, statusCode, req, res) => {
  const token = generateToken(user);

  const isProduction = process.env.NODE_ENV === 'production';
  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === 'true' || isProduction,
    sameSite: process.env.COOKIE_SAME_SITE || (isProduction ? 'none' : 'lax'),
  };

  res.cookie('token', token, cookieOptions);

  return res.status(statusCode).json({
    success: true,
    token,
    user: {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      baseId: user.baseId,
      rank: user.rank,
      serviceId: user.serviceId,
      lastLoginAt: user.lastLoginAt,
    },
  });
};

/**
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() })
      .select('+passwordHash')
      .populate('baseId');

    if (!user) {
      await auditService.log({
        req,
        action: 'LOGIN_FAILED',
        entityType: 'User',
        status: 'FAILURE',
        notes: `Failed login attempt for nonexistent email: ${email}`,
      });
      return res.status(401).json({
        success: false,
        message: 'Invalid operational credentials.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account disabled. Clearance suspended.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await auditService.log({
        req,
        userId: user._id,
        userName: user.fullName,
        role: user.role,
        baseId: user.baseId?._id,
        action: 'LOGIN_FAILED',
        entityType: 'User',
        status: 'FAILURE',
        notes: `Incorrect passphrase entered for user: ${email}`,
      });
      return res.status(401).json({
        success: false,
        message: 'Invalid operational credentials.',
      });
    }

    // Update lastLoginAt
    user.lastLoginAt = new Date();
    await user.save();

    await auditService.log({
      req,
      userId: user._id,
      userName: user.fullName,
      role: user.role,
      baseId: user.baseId?._id,
      action: 'LOGIN',
      entityType: 'User',
      entityId: user._id,
      status: 'SUCCESS',
      notes: `User authenticated successfully with ${user.role} privileges`,
    });

    sendTokenResponse(user, 200, req, res);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/me
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('baseId');
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/logout
 */
const logout = async (req, res, next) => {
  try {
    if (req.user) {
      await auditService.log({
        req,
        action: 'LOGOUT',
        entityType: 'User',
        entityId: req.user._id,
        status: 'SUCCESS',
        notes: `User logged out`,
      });
    }

    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 5 * 1000),
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === 'true' || isProduction,
      sameSite: process.env.COOKIE_SAME_SITE || (isProduction ? 'none' : 'lax'),
    });

    res.status(200).json({
      success: true,
      message: 'Successfully logged out.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  getMe,
  logout,
};
