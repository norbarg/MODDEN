import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 2525),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  async sendVerificationEmail(to: string, verificationLink: string) {
    const from = process.env.SMTP_FROM || process.env.SMTP_USER;

    try {
      await this.transporter.sendMail({
        from,
        to,
        subject: 'Verify your email for Modden',
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111;">
            <h2>Verify your email</h2>
            <p>Thank you for registering in Modden.</p>
            <p>Please confirm your email address by clicking the button below:</p>
            <p>
              <a href="${verificationLink}" 
                 style="display:inline-block;padding:12px 20px;background:#111;color:#fff;text-decoration:none;border-radius:8px;">
                 Verify Email
              </a>
            </p>
            <p>If the button does not work, use this link:</p>
            <p><a href="${verificationLink}">${verificationLink}</a></p>
          </div>
        `,
      });
    } catch (error) {
      console.error('Send mail error:', error);
      throw new InternalServerErrorException(
        'Failed to send verification email',
      );
    }
  }
}
