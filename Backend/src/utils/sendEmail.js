// src/utils/sendEmail.js

const nodemailer = require('nodemailer');
const logger = require('./logger');

// -------------------------------------------
// Create reusable transporter using SMTP credentials from .env
// -------------------------------------------
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true', // true for port 465, false for 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Core email-sending function. All specific email types (verification,
 * password reset, order confirmation) call this under the hood.
 *
 * @param {Object} options
 * @param {string} options.to - recipient email address
 * @param {string} options.subject - email subject line
 * @param {string} options.html - HTML body content
 */
const sendEmail = async ({ to, subject, html }) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
    });

    logger.info(`Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error(`Failed to send email to ${to}: ${error.message}`);
    throw error;
  }
};

// =========================================
// EMAIL TEMPLATES
// =========================================

/**
 * Sends an email verification link to a newly registered user.
 */
const sendVerificationEmail = async (toEmail, userName, verificationToken) => {
  const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${verificationToken}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #16a34a;">Welcome to Grocery Store, ${userName}! 🛒</h2>
      <p>Thanks for signing up. Please verify your email address to activate your account.</p>
      <a href="${verifyUrl}" style="display: inline-block; background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">
        Verify Email Address
      </a>
      <p>Or copy and paste this link into your browser:</p>
      <p style="color: #666; word-break: break-all;">${verifyUrl}</p>
      <p style="color: #999; font-size: 12px; margin-top: 24px;">This link will expire in 24 hours. If you didn't create this account, please ignore this email.</p>
    </div>
  `;

  return sendEmail({
    to: toEmail,
    subject: 'Verify Your Email — Grocery Store',
    html,
  });
};

/**
 * Sends a password reset link to a user who requested "Forgot Password".
 */
const sendPasswordResetEmail = async (toEmail, userName, resetToken) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #dc2626;">Password Reset Request</h2>
      <p>Hi ${userName},</p>
      <p>We received a request to reset your password. Click the button below to set a new password.</p>
      <a href="${resetUrl}" style="display: inline-block; background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">
        Reset Password
      </a>
      <p>Or copy and paste this link into your browser:</p>
      <p style="color: #666; word-break: break-all;">${resetUrl}</p>
      <p style="color: #999; font-size: 12px; margin-top: 24px;">This link will expire in 15 minutes. If you didn't request this, please ignore this email — your password will remain unchanged.</p>
    </div>
  `;

  return sendEmail({
    to: toEmail,
    subject: 'Password Reset Request — Grocery Store',
    html,
  });
};

/**
 * Sends an order confirmation email after successful checkout.
 */
const sendOrderConfirmationEmail = async (toEmail, userName, order) => {
  const itemsHtml = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">₹${item.price}</td>
      </tr>
    `
    )
    .join('');

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #16a34a;">Order Confirmed! 🎉</h2>
      <p>Hi ${userName},</p>
      <p>Thank you for your order. Here are your order details:</p>
      <p><strong>Order Number:</strong> ${order.orderNumber}</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="padding: 8px; text-align: left;">Item</th>
            <th style="padding: 8px; text-align: center;">Qty</th>
            <th style="padding: 8px; text-align: right;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
      <p style="text-align: right;"><strong>Total: ₹${order.totalAmount}</strong></p>
      <p>We'll notify you once your order is out for delivery.</p>
    </div>
  `;

  return sendEmail({
    to: toEmail,
    subject: `Order Confirmed — ${order.orderNumber}`,
    html,
  });
};

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendOrderConfirmationEmail,
};