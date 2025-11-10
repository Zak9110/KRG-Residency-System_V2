import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@krg-evisit.gov';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

/**
 * Send email using Resend
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  try {
    if (!resend || !process.env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not set. Skipping email send.');
      console.log(`[MOCK EMAIL] To: ${options.to}, Subject: ${options.subject}`);
      return;
    }

    await resend.emails.send({
      from: FROM_EMAIL,
      to: options.to,
      subject: options.subject,
      html: options.html
    });

    console.log(`Email sent to ${options.to}: ${options.subject}`);
  } catch (error) {
    console.error('Email send error:', error);
    // Don't throw error - we don't want email failures to break application flow
  }
}

/**
 * Send application confirmation email
 */
export async function sendApplicationConfirmation(
  email: string,
  fullName: string,
  referenceNumber: string
): Promise<void> {
  await sendEmail({
    to: email,
    subject: 'KRG e-Visit Application Received',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #1a73e8; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
            .button { background-color: #1a73e8; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>KRG e-Visit System</h1>
            </div>
            <div class="content">
              <h2>Application Received</h2>
              <p>Dear ${fullName},</p>
              <p>Your e-Visit application has been received successfully and is now under review.</p>
              <p><strong>Reference Number:</strong> <span style="font-size: 18px; color: #1a73e8;">${referenceNumber}</span></p>
              <p>You can track your application status using this reference number on our website.</p>
              <p>We will notify you via email once your application has been reviewed.</p>
              <p>Thank you for using the KRG e-Visit System.</p>
            </div>
            <div class="footer">
              <p>Kurdistan Regional Government - Ministry of Interior</p>
              <p>This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `
  });
}

/**
 * Send application approval email with QR code
 */
export async function sendApprovalEmail(
  email: string,
  fullName: string,
  referenceNumber: string,
  qrCode: string,
  validFrom: Date,
  validUntil: Date
): Promise<void> {
  await sendEmail({
    to: email,
    subject: 'KRG e-Visit Application Approved ✓',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #0f9d58; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .qr-code { text-align: center; margin: 20px 0; }
            .qr-code img { max-width: 300px; border: 2px solid #0f9d58; padding: 10px; background: white; }
            .info-box { background-color: #e8f5e9; border-left: 4px solid #0f9d58; padding: 15px; margin: 15px 0; }
            .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✓ Application Approved</h1>
            </div>
            <div class="content">
              <h2>Congratulations, ${fullName}!</h2>
              <p>Your e-Visit application has been <strong>APPROVED</strong>.</p>
              
              <div class="info-box">
                <p><strong>Reference Number:</strong> ${referenceNumber}</p>
                <p><strong>Valid From:</strong> ${validFrom.toLocaleDateString()}</p>
                <p><strong>Valid Until:</strong> ${validUntil.toLocaleDateString()}</p>
              </div>

              <div class="qr-code">
                <h3>Your e-Visit QR Code</h3>
                <img src="${qrCode}" alt="QR Code" />
                <p style="color: #d32f2f; font-weight: bold;">⚠ Please save this QR code and present it at checkpoints</p>
              </div>

              <h3>Important Instructions:</h3>
              <ul>
                <li>Save this email and keep the QR code accessible on your phone</li>
                <li>Present the QR code at KRG border checkpoints for entry and exit</li>
                <li>Your permit is valid only between the dates specified above</li>
                <li>Carry your passport and supporting documents during your visit</li>
              </ul>

              <p>We wish you a safe and pleasant visit to the Kurdistan Region.</p>
            </div>
            <div class="footer">
              <p>Kurdistan Regional Government - Ministry of Interior</p>
              <p>This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `
  });
}

/**
 * Send application rejection email
 */
export async function sendRejectionEmail(
  email: string,
  fullName: string,
  referenceNumber: string,
  reason: string
): Promise<void> {
  await sendEmail({
    to: email,
    subject: 'KRG e-Visit Application Status Update',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #d32f2f; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .info-box { background-color: #ffebee; border-left: 4px solid #d32f2f; padding: 15px; margin: 15px 0; }
            .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Application Status Update</h1>
            </div>
            <div class="content">
              <h2>Dear ${fullName},</h2>
              <p>We regret to inform you that your e-Visit application has not been approved at this time.</p>
              
              <div class="info-box">
                <p><strong>Reference Number:</strong> ${referenceNumber}</p>
                <p><strong>Reason:</strong> ${reason}</p>
              </div>

              <h3>Next Steps:</h3>
              <ul>
                <li>Review the reason for rejection carefully</li>
                <li>If you believe there was an error, you may submit a new application with corrected information</li>
                <li>Ensure all required documents are complete and accurate</li>
                <li>Contact our support team if you need clarification</li>
              </ul>

              <p>Thank you for your understanding.</p>
            </div>
            <div class="footer">
              <p>Kurdistan Regional Government - Ministry of Interior</p>
              <p>This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `
  });
}
