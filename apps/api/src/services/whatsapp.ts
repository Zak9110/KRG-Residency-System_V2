import twilio from 'twilio';

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID || '';
const authToken = process.env.TWILIO_AUTH_TOKEN || '';
const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER || '';
const smsNumber = process.env.TWILIO_SMS_NUMBER || '';

let twilioClient: twilio.Twilio | null = null;

if (accountSid && authToken) {
  twilioClient = twilio(accountSid, authToken);
  console.log('✅ Twilio client initialized');
} else {
  console.warn('⚠️  Twilio credentials not configured. WhatsApp/SMS disabled.');
}

// ===================================================================
// WHATSAPP NOTIFICATIONS
// ===================================================================

/**
 * Send application submitted confirmation via WhatsApp
 */
export async function sendApplicationSubmittedWhatsApp(
  phoneNumber: string,
  referenceNumber: string,
  fullName: string
): Promise<boolean> {
  if (!twilioClient || !whatsappNumber) {
    console.warn('WhatsApp not configured, skipping notification');
    return false;
  }

  try {
    const message = `
✅ *Application Submitted Successfully*

Dear ${fullName},

Your e-Visit application has been submitted.

📋 *Reference Number:* ${referenceNumber}

Your application is under review. We will notify you once it has been processed.

You can track your application status at any time.

Thank you for using KRG e-Visit System.
    `.trim();

    await twilioClient.messages.create({
      from: whatsappNumber,
      to: `whatsapp:${phoneNumber}`,
      body: message,
    });

    console.log(`✅ WhatsApp sent to ${phoneNumber}: Application submitted`);
    return true;
  } catch (error: any) {
    console.error('WhatsApp send error:', error.message);
    return false;
  }
}

/**
 * Send application approved notification via WhatsApp
 */
export async function sendApplicationApprovedWhatsApp(
  phoneNumber: string,
  referenceNumber: string,
  fullName: string,
  qrCodeUrl: string,
  expiryDate: string
): Promise<boolean> {
  if (!twilioClient || !whatsappNumber) {
    console.warn('WhatsApp not configured, skipping notification');
    return false;
  }

  try {
    const message = `
✅ *Application APPROVED*

Congratulations ${fullName}!

Your e-Visit permit has been approved.

📋 *Reference:* ${referenceNumber}
📅 *Valid Until:* ${expiryDate}

Your QR code permit is attached. Please:
• Save this QR code
• Show it at the checkpoint
• Keep it until you exit KRG

*Important:* This permit is valid for entry and stay until the expiry date.

Welcome to Kurdistan Region! 🎉
    `.trim();

    // Send message with QR code as media
    await twilioClient.messages.create({
      from: whatsappNumber,
      to: `whatsapp:${phoneNumber}`,
      body: message,
      mediaUrl: [qrCodeUrl],
    });

    console.log(`✅ WhatsApp sent to ${phoneNumber}: Application approved`);
    return true;
  } catch (error: any) {
    console.error('WhatsApp send error:', error.message);
    return false;
  }
}

/**
 * Send application rejected notification via WhatsApp
 */
export async function sendApplicationRejectedWhatsApp(
  phoneNumber: string,
  referenceNumber: string,
  fullName: string,
  reason: string,
  appealLink: string
): Promise<boolean> {
  if (!twilioClient || !whatsappNumber) {
    console.warn('WhatsApp not configured, skipping notification');
    return false;
  }

  try {
    const message = `
❌ *Application Rejected*

Dear ${fullName},

We regret to inform you that your application has been rejected.

📋 *Reference:* ${referenceNumber}
📝 *Reason:* ${reason}

*You can submit an appeal within 14 days:*
${appealLink}

If you believe this decision was made in error, please provide additional documentation with your appeal.

For assistance, contact our support office.
    `.trim();

    await twilioClient.messages.create({
      from: whatsappNumber,
      to: `whatsapp:${phoneNumber}`,
      body: message,
    });

    console.log(`✅ WhatsApp sent to ${phoneNumber}: Application rejected`);
    return true;
  } catch (error: any) {
    console.error('WhatsApp send error:', error.message);
    return false;
  }
}

/**
 * Send more documents requested notification via WhatsApp
 */
export async function sendDocumentsRequestedWhatsApp(
  phoneNumber: string,
  referenceNumber: string,
  fullName: string,
  requiredDocuments: string[],
  uploadLink: string,
  deadline: string
): Promise<boolean> {
  if (!twilioClient || !whatsappNumber) {
    console.warn('WhatsApp not configured, skipping notification');
    return false;
  }

  try {
    const docList = requiredDocuments.map((doc, i) => `${i + 1}. ${doc}`).join('\n');

    const message = `
📄 *Additional Documents Required*

Dear ${fullName},

Your application is being reviewed, but we need additional documents.

📋 *Reference:* ${referenceNumber}

*Required Documents:*
${docList}

⏰ *Deadline:* ${deadline}

*Upload here:*
${uploadLink}

Please upload the requested documents before the deadline to avoid application rejection.
    `.trim();

    await twilioClient.messages.create({
      from: whatsappNumber,
      to: `whatsapp:${phoneNumber}`,
      body: message,
    });

    console.log(`✅ WhatsApp sent to ${phoneNumber}: Documents requested`);
    return true;
  } catch (error: any) {
    console.error('WhatsApp send error:', error.message);
    return false;
  }
}

/**
 * Send permit expiry reminder via WhatsApp
 */
export async function sendExpiryReminderWhatsApp(
  phoneNumber: string,
  fullName: string,
  daysRemaining: number,
  expiryDate: string,
  renewLink: string
): Promise<boolean> {
  if (!twilioClient || !whatsappNumber) {
    console.warn('WhatsApp not configured, skipping notification');
    return false;
  }

  try {
    const urgency = daysRemaining <= 3 ? '🚨 URGENT' : '⚠️';
    const message = `
${urgency} *Permit Expiring Soon*

Dear ${fullName},

Your e-Visit permit will expire in *${daysRemaining} day${daysRemaining > 1 ? 's' : ''}*.

📅 *Expiry Date:* ${expiryDate}

${daysRemaining <= 3 ? '⚠️ *This is your final reminder!*' : ''}

*To extend your stay:*
${renewLink}

*Note:* After expiry, you must either:
• Renew your permit (within 3-day grace period)
• Exit Kurdistan Region

Overstaying without renewal may affect future applications.
    `.trim();

    await twilioClient.messages.create({
      from: whatsappNumber,
      to: `whatsapp:${phoneNumber}`,
      body: message,
    });

    console.log(`✅ WhatsApp sent to ${phoneNumber}: Expiry reminder (${daysRemaining} days)`);
    return true;
  } catch (error: any) {
    console.error('WhatsApp send error:', error.message);
    return false;
  }
}

/**
 * Send entry recorded notification via WhatsApp
 */
export async function sendEntryRecordedWhatsApp(
  phoneNumber: string,
  fullName: string,
  checkpointName: string,
  expiryDate: string
): Promise<boolean> {
  if (!twilioClient || !whatsappNumber) {
    console.warn('WhatsApp not configured, skipping notification');
    return false;
  }

  try {
    const message = `
✅ *Entry Recorded*

Welcome to Kurdistan Region, ${fullName}!

Your entry has been recorded at *${checkpointName}*.

📅 *Your permit is valid until:* ${expiryDate}

Please ensure you exit before this date or renew your permit.

Enjoy your visit! 🎉
    `.trim();

    await twilioClient.messages.create({
      from: whatsappNumber,
      to: `whatsapp:${phoneNumber}`,
      body: message,
    });

    console.log(`✅ WhatsApp sent to ${phoneNumber}: Entry recorded`);
    return true;
  } catch (error: any) {
    console.error('WhatsApp send error:', error.message);
    return false;
  }
}

// ===================================================================
// SMS NOTIFICATIONS (Backup)
// ===================================================================

/**
 * Send SMS notification (backup when WhatsApp fails)
 */
export async function sendSMS(phoneNumber: string, message: string): Promise<boolean> {
  if (!twilioClient || !smsNumber) {
    console.warn('SMS not configured, skipping notification');
    return false;
  }

  try {
    await twilioClient.messages.create({
      from: smsNumber,
      to: phoneNumber,
      body: message,
    });

    console.log(`✅ SMS sent to ${phoneNumber}`);
    return true;
  } catch (error: any) {
    console.error('SMS send error:', error.message);
    return false;
  }
}

/**
 * Send OTP via SMS
 */
export async function sendOTP(phoneNumber: string, otpCode: string): Promise<boolean> {
  const message = `Your KRG e-Visit verification code is: ${otpCode}\n\nValid for 10 minutes.\nDo not share this code.`;
  return await sendSMS(phoneNumber, message);
}
