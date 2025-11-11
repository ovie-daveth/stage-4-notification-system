const catchAsync = require('../utils/catchAsync');
const { buildResponse, defaultPaginationMeta } = require('../utils/response');
const emailProvider = require('../providers/nodemailerProvider');

const sendTestEmail = catchAsync(async (req, res) => {
  const {
    to,
    subject,
    html,
    text,
  } = req.body;

  const result = await emailProvider.sendEmail({
    to,
    subject,
    html,
    text,
  });

  return res.status(200).json(
    buildResponse({
      message: 'Test email dispatched',
      data: {
        message_id: result.messageId,
        to,
        accepted: result.accepted,
      },
      meta: defaultPaginationMeta,
    }),
  );
});

const providerWebhook = catchAsync(async (req, res) => {
  const { provider } = req.params;
  const { body, headers } = req;

  // Placeholder for provider-specific handling logic
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
  sendTestEmail,
  providerWebhook,
};

