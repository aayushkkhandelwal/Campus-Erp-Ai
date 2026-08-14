import nodemailer from 'nodemailer';

/**
 * Email Service Driver
 * Supports Real SMTP Delivery (Gmail, Outlook, SendGrid, Mailtrap),
 * Ethereal Online Mail Preview, and Dev Console Fallback.
 */

export interface IEmailProvider {
  sendEmail(to: string, subject: string, bodyText: string, htmlContent?: string): Promise<boolean>;
}

class NodemailerSmtpDriver implements IEmailProvider {
  private transporter: nodemailer.Transporter;
  private fromAddress: string;

  constructor() {
    const host = (process.env.SMTP_HOST || 'smtp.gmail.com').trim();
    const port = parseInt((process.env.SMTP_PORT || '587').trim(), 10);
    const user = (process.env.SMTP_USER || '').trim();
    const pass = (process.env.SMTP_PASS || '').replace(/\s+/g, '');
    this.fromAddress = process.env.SMTP_FROM || `"College ERP System" <${user}>`;

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      auth: {
        user,
        pass,
      },
    });
  }

  async sendEmail(to: string, subject: string, bodyText: string, htmlContent?: string): Promise<boolean> {
    try {
      const info = await this.transporter.sendMail({
        from: this.fromAddress,
        to,
        subject,
        text: bodyText,
        html: htmlContent || bodyText.replace(/\n/g, '<br/>'),
      });
      console.log(`\n==================================================`);
      console.log(`✅ [REAL EMAIL SENT SUCCESSFUL]`);
      console.log(`TO: ${to}`);
      console.log(`MessageId: ${info.messageId}`);
      console.log(`==================================================\n`);
      return true;
    } catch (err: any) {
      console.error(`\n❌ [SMTP DELIVERY FAILED]:`, err.message || err);
      console.log(`⚠️ Generating Ethereal test inbox preview link...\n`);
      
      // Fallback to Ethereal Online Preview so user can view real email in browser
      try {
        const testAccount = await nodemailer.createTestAccount();
        const testTransporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });

        const testInfo = await testTransporter.sendMail({
          from: `"College ERP System" <${testAccount.user}>`,
          to,
          subject,
          text: bodyText,
          html: htmlContent || bodyText.replace(/\n/g, '<br/>'),
        });

        const previewUrl = nodemailer.getTestMessageUrl(testInfo);
        console.log(`==================================================`);
        console.log(`📬 [REAL EMAIL SENT TO ONLINE INBOX]`);
        console.log(`TO: ${to}`);
        console.log(`SUBJECT: ${subject}`);
        console.log(`👉 PREVIEW EMAIL IN YOUR BROWSER: ${previewUrl}`);
        console.log(`==================================================\n`);
        return true;
      } catch (etherealErr: any) {
        console.log(`\n==================================================`);
        console.log(`📧 [FALLBACK EMAIL DISPATCH TO CONSOLE]`);
        console.log(`TO: ${to}`);
        console.log(`SUBJECT: ${subject}`);
        console.log(`BODY:\n${bodyText}`);
        console.log(`==================================================\n`);
        return false;
      }
    }
  }
}

class ConsoleEmailDriver implements IEmailProvider {
  async sendEmail(to: string, subject: string, bodyText: string): Promise<boolean> {
    console.log(`\n==================================================`);
    console.log(`📧 [DEV EMAIL CONSOLE - NO SMTP CONFIG DETECTED]`);
    console.log(`TO: ${to}`);
    console.log(`SUBJECT: ${subject}`);
    console.log(`BODY:\n${bodyText}`);
    console.log(`==================================================\n`);
    return true;
  }
}

class EmailService {
  private getDriver(): IEmailProvider {
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      return new NodemailerSmtpDriver();
    }
    return new ConsoleEmailDriver();
  }

  async sendEmail(to: string, subject: string, bodyText: string, htmlContent?: string): Promise<boolean> {
    return this.getDriver().sendEmail(to, subject, bodyText, htmlContent);
  }

  async sendOtp(email: string, otpCode: string, purpose: string = 'LOGIN_2FA'): Promise<boolean> {
    const purposeLabel = purpose === 'PASSWORD_RESET' ? 'Password Reset' : 'Two-Factor Authentication';
    const subject = `[College ERP] Your ${purposeLabel} Verification Code: ${otpCode}`;

    const bodyText = `Hello,

Your 6-digit verification OTP code for ${purposeLabel} is:

${otpCode}

This code is valid for 5 minutes. Please do not share this code with anyone.

Best regards,
College ERP Administration System`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #4f46e5; margin: 0;">College ERP System</h2>
          <p style="color: #64748b; font-size: 13px;">${purposeLabel} Security Verification</p>
        </div>
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 12px; text-align: center; margin-bottom: 20px;">
          <p style="margin: 0 0 10px 0; font-size: 14px; color: #334155;">Your 6-digit OTP code is:</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #4f46e5; font-family: monospace;">${otpCode}</div>
          <p style="margin: 10px 0 0 0; font-size: 12px; color: #94a3b8;">Valid for 5 minutes</p>
        </div>
        <p style="font-size: 12px; color: #64748b; text-align: center; margin: 0;">
          If you did not request this verification code, please ignore this email.
        </p>
      </div>
    `;

    return this.sendEmail(email, subject, bodyText, htmlContent);
  }

  async sendWelcomePasswordEmail(
    to: string,
    fullName: string,
    tempPassword: string,
    role: string = 'USER'
  ): Promise<boolean> {
    const subject = `[College ERP] Your Temporary Account Password`;

    const bodyText = `Hello ${fullName},

Your account has been set up in the College ERP System.

Your temporary account password is: ${tempPassword}

IMPORTANT: For security reasons, you are required to change your password immediately upon your first login.

Best regards,
College ERP Administration System`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 550px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #4f46e5; margin: 0;">College ERP System</h2>
          <p style="color: #64748b; font-size: 13px;">Initial Account Credentials (${role})</p>
        </div>
        <div style="padding: 16px; background-color: #f8fafc; border-radius: 12px; margin-bottom: 20px;">
          <p style="margin: 0 0 8px 0; color: #334155; font-size: 14px;">Hello <strong>${fullName}</strong>,</p>
          <p style="margin: 0 0 16px 0; color: #475569; font-size: 14px;">Your account has been set up in the system. Below is your temporary login password:</p>
          <div style="background-color: #e0e7ff; border: 1px dashed #6366f1; padding: 14px; border-radius: 8px; text-align: center; font-size: 22px; font-weight: bold; letter-spacing: 2px; color: #3730a3; font-family: monospace;">
            ${tempPassword}
          </div>
        </div>
        <div style="background-color: #fffbebfb; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 4px; margin-bottom: 20px;">
          <p style="margin: 0; font-size: 13px; color: #92400e;">
            <strong>⚠️ Security Notice:</strong> You are required to change your password immediately upon your first login.
          </p>
        </div>
        <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0;">
          If you have questions, please contact your ERP system administrator.
        </p>
      </div>
    `;

    return this.sendEmail(to, subject, bodyText, htmlContent);
  }
}

export const emailService = new EmailService();
