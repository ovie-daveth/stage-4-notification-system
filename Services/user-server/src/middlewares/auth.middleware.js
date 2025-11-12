const { verifyToken } = require('../utils/token');
const { ApplicationError } = require('../utils/errors');

const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApplicationError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    req.user = {
      user_id: decoded.user_id,
      email: decoded.email,
      token,
    };

    next();
  } catch (error) {
    if (error instanceof ApplicationError) {
      throw error;
    }
    throw new ApplicationError('Invalid or expired token', 401, 'UNAUTHORIZED');
  }
};

const requireRoles = (...roles) => {
  return async (req, res, next) => {
    try {
      const User = require('../models/user.model');
      const user = await User.findOne({ user_id: req.user.user_id });

      if (!user) {
        throw new ApplicationError('User not found', 404, 'USER_NOT_FOUND');
      }

      const userRoles = user.roles || [];
      const hasRequiredRole = roles.some((role) => userRoles.includes(role));

      if (!hasRequiredRole) {
        throw new ApplicationError('Insufficient permissions', 403, 'FORBIDDEN');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = {
  authenticate,
  requireRoles,
};

