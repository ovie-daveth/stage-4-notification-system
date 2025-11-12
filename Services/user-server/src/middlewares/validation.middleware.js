const { celebrate, Joi, Segments } = require('celebrate');

const registerUserValidator = celebrate({
  [Segments.BODY]: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    first_name: Joi.string().optional(),
    last_name: Joi.string().optional(),
    phone_number: Joi.string().optional(),
  }),
});

const loginValidator = celebrate({
  [Segments.BODY]: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),
});

const updateProfileValidator = celebrate({
  [Segments.BODY]: Joi.object({
    first_name: Joi.string().optional(),
    last_name: Joi.string().optional(),
    phone_number: Joi.string().optional(),
  }),
});

const updatePreferencesValidator = celebrate({
  [Segments.BODY]: Joi.object({
    email_notifications: Joi.boolean().optional(),
    push_notifications: Joi.boolean().optional(),
    quiet_hours_start: Joi.string().allow(null).optional(),
    quiet_hours_end: Joi.string().allow(null).optional(),
  }),
});

const pushTokenBodyValidator = celebrate({
  [Segments.BODY]: Joi.object({
    push_token: Joi.string().required(),
  }),
});

const pushTokenParamValidator = celebrate({
  [Segments.PARAMS]: Joi.object({
    push_token: Joi.string().required(),
  }),
});

const userIdParamValidator = celebrate({
  [Segments.PARAMS]: Joi.object({
    user_id: Joi.string().required(),
  }),
});

const listUsersValidator = celebrate({
  [Segments.QUERY]: Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    search: Joi.string().optional(),
    role: Joi.string().valid('user', 'admin').optional(),
    is_active: Joi.string().valid('true', 'false').optional(),
  }),
});

module.exports = {
  registerUserValidator,
  loginValidator,
  updateProfileValidator,
  updatePreferencesValidator,
  pushTokenBodyValidator,
  pushTokenParamValidator,
  userIdParamValidator,
  listUsersValidator,
};

