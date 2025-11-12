const User = require('../models/user.model');
const { ApplicationError } = require('../utils/errors');
const { hashPassword, comparePassword } = require('../utils/password');
const { generateToken } = require('../utils/token');
const buildLogger = require('../utils/logger');

const logger = buildLogger('user-service');

const createUser = async (payload) => {
  const {
    email, password, first_name, last_name, phone_number,
  } = payload;

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new ApplicationError(
      'User with this email already exists',
      409,
      'USER_ALREADY_EXISTS',
      { email },
    );
  }

  const password_hash = await hashPassword(password);

  const user = new User({
    email: email.toLowerCase(),
    password_hash,
    first_name,
    last_name,
    phone_number,
  });

  await user.save();

  logger.info('User created successfully', { user_id: user.user_id, email: user.email });

  const userObject = user.toSafeObject();
  const access_token = generateToken({ user_id: user.user_id, email: user.email });

  return {
    user: userObject,
    access_token,
  };
};

const loginUser = async (payload) => {
  const { email, password } = payload;

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw new ApplicationError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  if (!user.is_active) {
    throw new ApplicationError('User account is inactive', 403, 'ACCOUNT_INACTIVE');
  }

  const isPasswordValid = await comparePassword(password, user.password_hash);
  if (!isPasswordValid) {
    throw new ApplicationError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  user.last_login_at = new Date();
  await user.save();

  logger.info('User logged in successfully', { user_id: user.user_id, email: user.email });

  const userObject = user.toSafeObject();
  const access_token = generateToken({ user_id: user.user_id, email: user.email });

  return {
    user: userObject,
    access_token,
  };
};

const getUserById = async (userId) => {
  const user = await User.findOne({ user_id: userId });
  if (!user) {
    throw new ApplicationError('User not found', 404, 'USER_NOT_FOUND', { user_id: userId });
  }

  return user.toSafeObject();
};

const getCurrentUser = async (userId) => {
  const user = await User.findOne({ user_id: userId });
  if (!user) {
    throw new ApplicationError('User not found', 404, 'USER_NOT_FOUND', { user_id: userId });
  }

  return user.toSafeObject();
};

const updateProfile = async (userId, payload) => {
  const { first_name, last_name, phone_number } = payload;

  const user = await User.findOne({ user_id: userId });
  if (!user) {
    throw new ApplicationError('User not found', 404, 'USER_NOT_FOUND', { user_id: userId });
  }

  if (first_name !== undefined) user.first_name = first_name;
  if (last_name !== undefined) user.last_name = last_name;
  if (phone_number !== undefined) user.phone_number = phone_number;

  await user.save();

  logger.info('User profile updated', { user_id: user.user_id });

  return user.toSafeObject();
};

const updatePreferences = async (userId, payload) => {
  const {
    email_notifications, push_notifications, quiet_hours_start, quiet_hours_end,
  } = payload;

  const user = await User.findOne({ user_id: userId });
  if (!user) {
    throw new ApplicationError('User not found', 404, 'USER_NOT_FOUND', { user_id: userId });
  }

  if (email_notifications !== undefined) user.preferences.email_notifications = email_notifications;
  if (push_notifications !== undefined) user.preferences.push_notifications = push_notifications;
  if (quiet_hours_start !== undefined) user.preferences.quiet_hours_start = quiet_hours_start;
  if (quiet_hours_end !== undefined) user.preferences.quiet_hours_end = quiet_hours_end;

  await user.save();

  logger.info('User preferences updated', { user_id: user.user_id });

  return user.toSafeObject();
};

const addPushToken = async (userId, pushToken) => {
  const user = await User.findOne({ user_id: userId });
  if (!user) {
    throw new ApplicationError('User not found', 404, 'USER_NOT_FOUND', { user_id: userId });
  }

  if (!user.push_tokens.includes(pushToken)) {
    user.push_tokens.push(pushToken);
    await user.save();
  }

  logger.info('Push token added', { user_id: user.user_id });

  return user.toSafeObject();
};

const removePushToken = async (userId, pushToken) => {
  const user = await User.findOne({ user_id: userId });
  if (!user) {
    throw new ApplicationError('User not found', 404, 'USER_NOT_FOUND', { user_id: userId });
  }

  user.push_tokens = user.push_tokens.filter((token) => token !== pushToken);
  await user.save();

  logger.info('Push token removed', { user_id: user.user_id });

  return user.toSafeObject();
};

const listUsers = async (query) => {
  const {
    page = 1, limit = 10, search, role, is_active,
  } = query;
  const skip = (page - 1) * limit;

  const filter = {};

  if (search) {
    filter.$or = [
      { email: { $regex: search, $options: 'i' } },
      { first_name: { $regex: search, $options: 'i' } },
      { last_name: { $regex: search, $options: 'i' } },
    ];
  }

  if (role) {
    filter.roles = role;
  }

  if (is_active !== undefined) {
    filter.is_active = is_active === 'true';
  }

  const [users, total] = await Promise.all([
    User.find(filter).skip(skip).limit(limit).sort({ created_at: -1 }),
    User.countDocuments(filter),
  ]);

  return {
    users: users.map((user) => user.toSafeObject()),
    total,
    page: Number(page),
    limit: Number(limit),
  };
};

module.exports = {
  createUser,
  loginUser,
  getUserById,
  getCurrentUser,
  updateProfile,
  updatePreferences,
  addPushToken,
  removePushToken,
  listUsers,
};

