import { Injectable, InternalServerErrorException } from '@nestjs/common';

@Injectable()
export class MailService {
  async sendVerificationEmail(to: string, verificationLink: string) {
    const resendApiKey = process.env.RESEND_API_KEY;
    const from = process.env.EMAIL_FROM || 'Modden <onboarding@resend.dev>';

    if (!resendApiKey) {
      console.error('Send mail error: RESEND_API_KEY is not set');
      throw new InternalServerErrorException(
        'Failed to send verification email',
      );
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
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
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Send mail error:', errorText);
        throw new InternalServerErrorException(
          'Failed to send verification email',
        );
      }
    } catch (error) {
      console.error('Send mail error:', error);
      throw new InternalServerErrorException(
        'Failed to send verification email',
      );
    }
  }
}
