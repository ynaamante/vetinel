const nodemailer = require('nodemailer');

function getTransport() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_SECURE } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD) return null;
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 587),
    secure: String(SMTP_SECURE || '').toLowerCase() === 'true',
    auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
  });
}

async function sendOwnerCredentials({ email, ownerName, clinicName, temporaryPassword }) {
  const transport = getTransport();
  if (!transport) {
    return { sent: false, reason: 'SMTP is not configured' };
  }

  await transport.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: `Your VetIntel account for ${clinicName}`,
    text: [
      `Hello ${ownerName},`,
      '',
      `Your VetIntel clinic account for ${clinicName} has been approved.`,
      `Email: ${email}`,
      `Temporary password: ${temporaryPassword}`,
      '',
      'Sign in through your clinic portal and change this password immediately.',
      'If you did not request this account, contact VetIntel support.',
    ].join('\n'),
  });

  return { sent: true };
}

async function sendMessageNotification({ email, senderName, subject }) {
  const transport = getTransport();
  if (!transport) return { sent: false, reason: 'SMTP is not configured' };
  await transport.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: `VetIntel replied: ${subject}`,
    text: `Hello ${senderName},\n\nThe VetIntel team has replied to your message. Please sign in to view the conversation.`,
  });
  return { sent: true };
}

async function sendPurchaseOrder({ email, supplier, purchaseOrderId, requestedBy, expectedDeliveryDate, notes }) {
  const transport = getTransport();
  if (!transport) return { sent: false, reason: 'SMTP is not configured' };
  await transport.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: `VetIntel purchase order ${purchaseOrderId}`,
    text: [
      `Hello ${supplier},`,
      '',
      `VetIntel has created purchase order ${purchaseOrderId}.`,
      `Requested by: ${requestedBy}`,
      `Expected delivery date: ${expectedDeliveryDate || 'To be confirmed'}`,
      `Notes: ${notes || 'None'}`,
      '',
      'Please review this purchase order and confirm receipt with the clinic.',
    ].join('\n'),
  });
  return { sent: true };
}

module.exports = { sendOwnerCredentials, sendMessageNotification, sendPurchaseOrder };
