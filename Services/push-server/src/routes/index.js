const express = require('express');
const healthController = require('../controllers/health.controller');
const pushController = require('../controllers/push.controller');
const { testPushValidator, providerWebhookValidator } = require('../middlewares/validation.middleware');

const router = express.Router();

router.get('/health', healthController.getHealth);
router.post('/api/v1/push/test-send', testPushValidator, pushController.sendTestPush);
router.post('/api/v1/push/webhook/:provider', providerWebhookValidator, pushController.providerWebhook);

module.exports = router;

