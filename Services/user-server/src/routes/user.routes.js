const express = require('express');
const userController = require('../controllers/user.controller');
const {
  registerUserValidator,
  loginValidator,
  updateProfileValidator,
  updatePreferencesValidator,
  pushTokenBodyValidator,
  pushTokenParamValidator,
  userIdParamValidator,
  listUsersValidator,
} = require('../middlewares/validation.middleware');
const { authenticate, requireRoles } = require('../middlewares/auth.middleware');

const router = express.Router();

// Public routes
router.post('/users', registerUserValidator, userController.registerUser);
router.post('/users/login', loginValidator, userController.loginUser);

// Authenticated user routes (must come before /users/:user_id to avoid conflicts)
router.get('/users/me', authenticate, userController.getCurrentUser);
router.patch('/users/me', authenticate, updateProfileValidator, userController.updateProfile);
router.patch(
  '/users/me/preferences',
  authenticate,
  updatePreferencesValidator,
  userController.updatePreferences,
);

router.post(
  '/users/me/push-tokens',
  authenticate,
  pushTokenBodyValidator,
  userController.addPushToken,
);

router.delete(
  '/users/me/push-tokens/:push_token',
  authenticate,
  pushTokenParamValidator,
  userController.removePushToken,
);

// Admin routes (must come before /users/:user_id to avoid conflicts)
router.get('/users', authenticate, requireRoles('admin'), listUsersValidator, userController.listUsers);

// Internal service routes (no auth for microservice communication)
router.get('/users/:user_id', userIdParamValidator, userController.getUserById);
router.delete(
  '/users/:user_id/push-tokens/:push_token',
  userIdParamValidator,
  pushTokenParamValidator,
  userController.removePushToken,
);

module.exports = router;

