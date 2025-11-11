const express = require('express');
const healthController = require('../controllers/health.controller');
const emailController = require('../controllers/email.controller');
const { testEmailValidator, providerWebhookValidator } = require('../middlewares/validation.middleware');

const router = express.Router();

router.get('/health', healthController.getHealth);
router.post('/api/v1/email/test-send', testEmailValidator, emailController.sendTestEmail);
router.post(
  '/api/v1/email/webhook/:provider',
  providerWebhookValidator,
  emailController.providerWebhook,
);

module.exports = router;

