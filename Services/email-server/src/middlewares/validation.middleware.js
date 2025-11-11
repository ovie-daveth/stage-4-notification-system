const { celebrate, Joi, Segments } = require('celebrate');

const testEmailValidator = celebrate({
  [Segments.BODY]: Joi.object({
    to: Joi.string().email().required(),
    subject: Joi.string().min(3).max(200).required(),
    html: Joi.string().required(),
    text: Joi.string().optional(),
  }),
});

const providerWebhookValidator = celebrate({
  [Segments.PARAMS]: Joi.object({
    provider: Joi.string().required(),
  }),
});

module.exports = {
  testEmailValidator,
  providerWebhookValidator,
};

