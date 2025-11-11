const { celebrate, Joi, Segments } = require('celebrate');

const testPushValidator = celebrate({
  [Segments.BODY]: Joi.object({
    push_token: Joi.string().trim().required(),
    title: Joi.string().min(1).max(150).required(),
    body: Joi.string().min(1).max(500).required(),
    data: Joi.object().pattern(Joi.string(), Joi.string()).optional(),
    image: Joi.string().uri().optional(),
  }),
});

const providerWebhookValidator = celebrate({
  [Segments.PARAMS]: Joi.object({
    provider: Joi.string().required(),
  }),
});

module.exports = {
  testPushValidator,
  providerWebhookValidator,
};

