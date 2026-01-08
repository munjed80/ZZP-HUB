#!/usr/bin/env node

/**
 * Test Resend email integration
 * 
 * Usage:
 *   TEST_TO=your@email.com RESEND_API_KEY=re_xxx node scripts/test-resend.mjs
 * 
 * Exit codes:
 *   0 - Success (email sent)
 *   1 - Failure (configuration error or send failure)
 */

import { Resend } from 'resend';

// Configuration
const TEST_TO = process.env.TEST_TO;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'ZZP Hub <no-reply@matrixtop.com>';

// Validation
if (!TEST_TO) {
  console.error('❌ ERROR: TEST_TO environment variable is required');
  console.error('   Usage: TEST_TO=your@email.com node scripts/test-resend.mjs');
  process.exit(1);
}

if (!RESEND_API_KEY) {
  console.error('❌ ERROR: RESEND_API_KEY environment variable is required');
  console.error('   Set your Resend API key in the environment');
  process.exit(1);
}

// Validate FROM email format
if (!FROM_EMAIL.includes('<') || !FROM_EMAIL.includes('>') || !FROM_EMAIL.includes('@')) {
  console.error(`❌ ERROR: Invalid FROM email format: "${FROM_EMAIL}"`);
  console.error('   Must be in "Name <email@domain>" format');
  process.exit(1);
}

console.log('\n🔍 Resend Email Test');
console.log('='.repeat(50));
console.log(`From: ${FROM_EMAIL}`);
console.log(`To:   ${TEST_TO}`);
console.log('='.repeat(50));

// Create Resend client
const resend = new Resend(RESEND_API_KEY);

// Test email content
const subject = 'Test Email - Resend Integration Test';
const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Test Email</title>
</head>
<body style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
  <h1 style="color: #333;">✅ Resend Test Email</h1>
  <p>This is a test email from the ZZP Hub Resend integration.</p>
  <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
  <hr style="border: 1px solid #eee; margin: 20px 0;">
  <p style="color: #666; font-size: 14px;">
    If you received this email, your Resend integration is working correctly!
  </p>
</body>
</html>
`;

// Send test email
async function sendTestEmail() {
  try {
    console.log('\n📤 Sending test email...');
    
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: TEST_TO,
      subject,
      html,
    });

    // Check for error in response
    if (result.error) {
      console.error('\n❌ Email send FAILED');
      console.error('─'.repeat(50));
      console.error(`Error: ${result.error.message}`);
      if (result.error.name) {
        console.error(`Type:  ${result.error.name}`);
      }
      if (result.error.statusCode) {
        console.error(`Code:  ${result.error.statusCode}`);
      }
      console.error('─'.repeat(50));
      console.error('\nTroubleshooting:');
      console.error('  1. Verify RESEND_API_KEY is correct');
      console.error('  2. Check that FROM email domain is verified in Resend');
      console.error('  3. Ensure TO email is valid');
      console.error('  4. Check Resend dashboard for quota/limits');
      process.exit(1);
    }

    // Check for missing message ID
    if (!result.data || !result.data.id) {
      console.error('\n❌ Email send FAILED');
      console.error('─'.repeat(50));
      console.error('Error: No message ID returned from Resend');
      console.error('This indicates the email was not accepted by Resend');
      console.error('─'.repeat(50));
      process.exit(1);
    }

    // Success!
    console.log('\n✅ Email sent successfully!');
    console.log('─'.repeat(50));
    console.log(`Message ID: ${result.data.id}`);
    console.log('─'.repeat(50));
    console.log('\n📊 Structured log (JSON):');
    console.log(JSON.stringify({
      event: 'email_send_success',
      messageId: result.data.id,
      to: TEST_TO,
      from: FROM_EMAIL,
      subject,
      timestamp: new Date().toISOString(),
    }, null, 2));
    
    console.log('\n✅ Test completed successfully!');
    console.log('Check your inbox at:', TEST_TO);
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Unexpected error during email send');
    console.error('─'.repeat(50));
    console.error('Error:', error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    console.error('─'.repeat(50));
    process.exit(1);
  }
}

// Run the test
sendTestEmail();
