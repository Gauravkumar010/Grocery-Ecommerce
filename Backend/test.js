// test-email.js — TEMPORARY, delete after use
require('dotenv').config({ quiet: true });
const {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendOrderConfirmationEmail,
} = require('./src/utils/sendEmail');

const TEST_RECIPIENT = 'sandykoli736@gmail.com'; // <-- CHANGE THIS

const run = async () => {
  console.log('Sending verification email...');
  await sendVerificationEmail(TEST_RECIPIENT, 'Test User', 'fake-verification-token-12345');
  console.log('Verification email sent!');

  console.log('Sending password reset email...');
  await sendPasswordResetEmail(TEST_RECIPIENT, 'Test User', 'fake-reset-token-67890');
  console.log('Password reset email sent!');

  console.log('Sending order confirmation email...');
  await sendOrderConfirmationEmail(TEST_RECIPIENT, 'Test User', {
    orderNumber: 'ORD-20260710-9999',
    items: [
      { name: 'Fresh Bananas', quantity: 2, price: 50 },
      { name: 'Fresh Apples', quantity: 1, price: 180 },
    ],
    totalAmount: 280,
  });
  console.log('Order confirmation email sent!');

  console.log('All emails sent. Check your inbox at:', TEST_RECIPIENT);
  process.exit(0);
};

run().catch((err) => {
  console.error('Test failed:', err.message);
  process.exit(1);
});