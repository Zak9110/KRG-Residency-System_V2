import crypto from 'crypto';
import QRCode from 'qrcode';
import { QRPayload } from '@krg-evisit/shared-types';

const HMAC_SECRET = process.env.HMAC_SECRET || 'your-hmac-secret-key';

/**
 * Generate QR code with HMAC signature for an application
 */
export async function generateQRCode(applicationId: string): Promise<{ qrCode: string; signature: string }> {
  try {
    const timestamp = new Date().toISOString();
    
    // Create payload
    const payload: QRPayload = {
      applicationId,
      timestamp
    };

    // Generate HMAC signature
    const signature = generateHMAC(payload);
    
    // Create full QR data
    const qrData = JSON.stringify({
      ...payload,
      signature
    });

    // Generate QR code as base64 data URL
    const qrCode = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 300,
      margin: 2
    });

    return { qrCode, signature };
  } catch (error) {
    console.error('QR generation error:', error);
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Verify QR code signature
 */
export async function verifyQRCode(qrPayloadString: string): Promise<{
  valid: boolean;
  applicationId?: string;
  error?: string;
}> {
  try {
    const qrData = JSON.parse(qrPayloadString);
    const { applicationId, timestamp, signature } = qrData;

    if (!applicationId || !timestamp || !signature) {
      return { valid: false, error: 'Invalid QR code format' };
    }

    // Verify HMAC signature
    const payload: QRPayload = { applicationId, timestamp };
    const expectedSignature = generateHMAC(payload);

    if (signature !== expectedSignature) {
      return { valid: false, error: 'Invalid QR code signature' };
    }

    // Check if QR code is not too old (24 hours)
    const qrTimestamp = new Date(timestamp).getTime();
    const now = new Date().getTime();
    const hoursDiff = (now - qrTimestamp) / (1000 * 60 * 60);

    if (hoursDiff > 24) {
      return { valid: false, error: 'QR code has expired (older than 24 hours)' };
    }

    return { valid: true, applicationId };
  } catch (error) {
    return { valid: false, error: 'Failed to parse QR code' };
  }
}

/**
 * Generate HMAC signature for QR payload
 */
function generateHMAC(payload: QRPayload): string {
  const data = `${payload.applicationId}:${payload.timestamp}`;
  return crypto
    .createHmac('sha256', HMAC_SECRET)
    .update(data)
    .digest('hex');
}
