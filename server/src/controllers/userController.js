const { User, Base } = require('../models');
const auditService = require('../services/auditService');

/**
 * GET /api/users
 */
const getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, role, baseId, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const query = {};
    if (role) query.role = role;
    if (baseId) query.baseId = baseId;

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { serviceId: { $regex: search, $options: 'i' } },
        { rank: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [items, total] = await Promise.all([
      User.find(query).populate('baseId', 'name code location').sort(sort).skip(skip).limit(limitNum).lean(),
      User.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      items,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/users/:id
 */
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).populate('baseId');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.',
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/users
 */
const createUser = async (req, res, next) => {
  try {
    const { fullName, email, password, role, baseId, rank, serviceId } = req.body;

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'A user account with this email address already exists.',
      });
    }

    if (role === 'BASE_COMMANDER' && !baseId) {
      return res.status(400).json({
        success: false,
        message: 'Base Commander accounts must be assigned to an installation base.',
      });
    }

    const passwordHash = await User.hashPassword(password);

    const user = new User({
      fullName,
      email: email.toLowerCase(),
      passwordHash,
      role,
      baseId: baseId || null,
      rank: rank || 'Officer',
      serviceId: serviceId || `CAC-${Math.floor(10000 + Math.random() * 90000)}`,
      isActive: true,
    });

    const saved = await user.save();

    await auditService.log({
      req,
      action: 'USER_CREATED',
      entityType: 'User',
      entityId: saved._id,
      baseId: saved.baseId,
      after: saved.toJSON(),
      notes: `Created account for ${fullName} with ${role} privileges`,
    });

    const populated = await User.findById(saved._id).populate('baseId');

    res.status(201).json({
      success: true,
      message: 'User account provisioned successfully.',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/users/:id
 */
const updateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.',
      });
    }

    const beforeState = user.toObject();
    const { fullName, email, role, baseId, rank, isActive, password } = req.body;

    if (fullName) user.fullName = fullName;
    if (email) user.email = email.toLowerCase();
    if (role) {
      if (role === 'BASE_COMMANDER' && !baseId && !user.baseId) {
        return res.status(400).json({
          success: false,
          message: 'Base Commander must have an assigned base.',
        });
      }
      user.role = role;
    }
    if (baseId !== undefined) user.baseId = baseId || null;
    if (rank) user.rank = rank;
    if (isActive !== undefined) user.isActive = isActive;
    if (password) {
      user.passwordHash = await User.hashPassword(password);
    }

    const saved = await user.save();

    const roleChanged = beforeState.role !== saved.role;

    await auditService.log({
      req,
      action: roleChanged ? 'ROLE_CHANGED' : 'USER_UPDATED',
      entityType: 'User',
      entityId: saved._id,
      baseId: saved.baseId,
      before: beforeState,
      after: saved.toJSON(),
      notes: roleChanged
        ? `Security clearance altered from ${beforeState.role} to ${saved.role}`
        : `User profile modified`,
    });

    const populated = await User.findById(saved._id).populate('baseId');

    res.status(200).json({
      success: true,
      message: 'User account updated successfully.',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
};
