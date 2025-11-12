const catchAsync = require('../utils/catchAsync');
const { buildResponse, defaultPaginationMeta } = require('../utils/response');
const fcmProvider = require('../providers/fcmProvider');

const sendTestPush = catchAsync(async (req, res) => {
  const {
    push_token,
    title,
    body,
    data,
    image,
  } = req.body;

  const response = await fcmProvider.sendPush({
    tokens: [push_token],
    title,
    body,
    data,
    image,
    notificationId: 'test-notification',
    correlationId: 'test-correlation',
  });

  return res.status(200).json(
    buildResponse({
      message: 'Test push dispatched',
      data: {
        success_count: response.successCount,
        failure_count: response.failureCount,
        responses: response.responses,
      },
      meta: defaultPaginationMeta,
    }),
  );
});

const providerWebhook = catchAsync(async (req, res) => {
  const { provider } = req.params;
  const { body, headers } = req;

  return res.status(200).json(
    buildResponse({
      message: `Webhook received from ${provider}`,
      data: {
        provider,
        received_at: new Date().toISOString(),
        headers,
        body,
      },
      meta: defaultPaginationMeta,
    }),
  );
});

module.exports = {
  sendTestPush,
  providerWebhook,
};

