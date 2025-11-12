const express = require('express');
const userRoutes = require('./user.routes');
const healthController = require('../controllers/health.controller');

const router = express.Router();

router.get('/health', healthController.healthCheck);
router.use('/api/v1', userRoutes);

module.exports = router;

