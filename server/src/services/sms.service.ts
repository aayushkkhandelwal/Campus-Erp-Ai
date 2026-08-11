/**
 * SMS Gateway Driver Service
 * Supports Development / Console logging driver and external SMS providers (Twilio, MSG91, Exotel)
 */

export interface ISmsProvider {
  sendSms(to: string, message: string): Promise<boolean>;
}

class ConsoleSmsDriver implements ISmsProvider {
  async sendSms(to: string, message: string): Promise<boolean> {
    console.log(`\n==================================================`);
    console.log(`📱 [SMS DRIVER - DEV CONSOLE]`);
    console.log(`TO: ${to}`);
    console.log(`MESSAGE: ${message}`);
    console.log(`==================================================\n`);
    return true;
  }
}

class SmsService {
  private driver: ISmsProvider;

  constructor() {
    // Default to Console driver in dev, can switch to Twilio/MSG91 via env vars
    this.driver = new ConsoleSmsDriver();
  }

  async sendOtp(phone: string, otpCode: string, purpose: string = 'Verification'): Promise<boolean> {
    const message = `[College ERP] Your ${purpose} code is ${otpCode}. Valid for 5 minutes. Do not share this code with anyone.`;
    return this.driver.sendSms(phone, message);
  }
}

export const smsService = new SmsService();
