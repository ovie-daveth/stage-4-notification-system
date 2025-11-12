const userService = require('../services/user.service');
const { buildResponse, buildPaginationMeta } = require('../utils/response');
const catchAsync = require('../utils/catchAsync');

const registerUser = catchAsync(async (req, res) => {
  const result = await userService.createUser(req.body);
  return res.status(201).json(
    buildResponse({
      message: 'User registered successfully',
      data: result,
    }),
  );
});

const loginUser = catchAsync(async (req, res) => {
  const result = await userService.loginUser(req.body);
  return res.status(200).json(
    buildResponse({
      message: 'User logged in successfully',
      data: result,
    }),
  );
});

const getCurrentUser = catchAsync(async (req, res) => {
  const user = await userService.getCurrentUser(req.user.user_id);
  return res.status(200).json(
    buildResponse({
      message: 'User retrieved successfully',
      data: user,
    }),
  );
});

const getUserById = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.params.user_id);
  return res.status(200).json(
    buildResponse({
      message: 'User retrieved successfully',
      data: user,
    }),
  );
});

const updateProfile = catchAsync(async (req, res) => {
  const user = await userService.updateProfile(req.user.user_id, req.body);
  return res.status(200).json(
    buildResponse({
      message: 'Profile updated successfully',
      data: user,
    }),
  );
});

const updatePreferences = catchAsync(async (req, res) => {
  const user = await userService.updatePreferences(req.user.user_id, req.body);
  return res.status(200).json(
    buildResponse({
      message: 'Preferences updated successfully',
      data: user,
    }),
  );
});

const addPushToken = catchAsync(async (req, res) => {
  const user = await userService.addPushToken(req.user.user_id, req.body.push_token);
  return res.status(200).json(
    buildResponse({
      message: 'Push token added successfully',
      data: user,
    }),
  );
});

const removePushToken = catchAsync(async (req, res) => {
  const userId = req.user?.user_id || req.params.user_id;
  const user = await userService.removePushToken(userId, req.params.push_token);
  return res.status(200).json(
    buildResponse({
      message: 'Push token removed successfully',
      data: user,
    }),
  );
});

const listUsers = catchAsync(async (req, res) => {
  const result = await userService.listUsers(req.query);
  const meta = buildPaginationMeta({
    total: result.total,
    limit: result.limit,
    page: result.page,
  });
  return res.status(200).json(
    buildResponse({
      message: 'Users retrieved successfully',
      data: result.users,
      meta,
    }),
  );
});

module.exports = {
  registerUser,
  loginUser,
  getCurrentUser,
  getUserById,
  updateProfile,
  updatePreferences,
  addPushToken,
  removePushToken,
  listUsers,
};

