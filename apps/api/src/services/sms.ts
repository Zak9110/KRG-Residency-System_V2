interface SMSOptions {
  to: string;
  message: string;
}

export class SMSService {
  /**
   * Send SMS (uses mock mode for testing - logs to console)
   * In production with Twilio, this would send real SMS
   */
  static async send({ to, message }: SMSOptions): Promise<boolean> {
    try {
      // Mock SMS for development (no Twilio needed)
      console.log('\n📱 ==================== SMS SENT ====================');
      console.log(`📱 To: ${to}`);
      console.log(`📱 Message:\n${message}`);
      console.log('📱 ==================================================\n');
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return true;
    } catch (error) {
      console.error('❌ SMS send failed:', error);
      return false;
    }
  }

  /**
   * Send OTP verification code
   */
  static async sendOTP(phoneNumber: string, code: string): Promise<boolean> {
    const message = `Your KRG e-Visit verification code is: ${code}\n\nValid for 10 minutes.\n\nDo not share this code.`;
    return this.send({ to: phoneNumber, message });
  }

  /**
   * Send application submitted notification
   */
  static async sendApplicationSubmitted(phoneNumber: string, referenceNumber: string): Promise<boolean> {
    const message = `✅ Application submitted successfully!\n\nReference: ${referenceNumber}\n\nTrack status: krg-evisit.gov/track\n\nYou'll receive updates via SMS.`;
    return this.send({ to: phoneNumber, message });
  }

  /**
   * Send approval notification
   */
  static async sendApprovalNotification(phoneNumber: string, referenceNumber: string): Promise<boolean> {
    const message = `🎉 Your e-Visit permit has been APPROVED!\n\nReference: ${referenceNumber}\n\nDownload your QR code: krg-evisit.gov/track\n\nShow this at the checkpoint.`;
    return this.send({ to: phoneNumber, message });
  }

  /**
   * Send rejection notification
   */
  static async sendRejectionNotification(phoneNumber: string, referenceNumber: string, reason: string): Promise<boolean> {
    const message = `❌ Application ${referenceNumber} was rejected.\n\nReason: ${reason}\n\nYou can reapply or contact support.`;
    return this.send({ to: phoneNumber, message });
  }

  /**
   * Send documents requested notification
   */
  static async sendDocumentsRequested(phoneNumber: string, referenceNumber: string): Promise<boolean> {
    const message = `📄 Additional documents required for application ${referenceNumber}\n\nCheck your application status for details.\n\nTrack: krg-evisit.gov/track`;
    return this.send({ to: phoneNumber, message });
  }

  /**
   * Send entry recorded notification
   */
  static async sendEntryRecorded(phoneNumber: string, checkpointName: string, exitDate: string): Promise<boolean> {
    const message = `✅ Entry recorded at ${checkpointName}\n\nYour permit is now ACTIVE.\n\nPermit valid until: ${exitDate}\n\nSafe travels!`;
    return this.send({ to: phoneNumber, message });
  }
}
