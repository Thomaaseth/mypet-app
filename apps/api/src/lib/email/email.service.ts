import { Resend } from 'resend';
import { config } from '../../config';

const resend = new Resend(config.email.resendApiKey);

// Email configuration
// Use Resend's default domain 
const FROM_EMAIL = 'Pettr <onboarding@resend.dev>';
const APP_NAME = 'Pettr';
const APP_URL = config.env.webUrl;

interface EmailOptions {
    to: string;
    subject: string;
    html: string;
}

interface EmailResult {
    success: boolean;
    error?: string;
}

// Send EMAIL
export async function sendEmail({ to, subject, html }: EmailOptions): Promise<EmailResult> {
    try {
        const { data, error } = await resend.emails.send({
            from: FROM_EMAIL,
            to: [to],
            subject,
            html,
        });

        if (error) {
            console.error('Resend error:', error);
            return { success: false, error: error.message}
        }
        console.log('Email send successfully:', data);
        return { success: true };
    } catch (error) {
        console.error('Email service error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to send email'
        };
    }
}

// Templates
export const emailTemplates = {
    /**
     * Email verification template
     */
    verifyEmail: (userName: string, verificationUrl: string) => ({
      subject: `Verify your email for ${APP_NAME}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify Your Email</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f5f5f5;
              }
              .container {
                background-color: white;
                border-radius: 10px;
                padding: 30px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              }
              .header {
                text-align: center;
                margin-bottom: 30px;
              }
              .logo {
                font-size: 28px;
                font-weight: bold;
                color: #4F46E5;
                margin-bottom: 10px;
              }
              .button {
                display: inline-block;
                padding: 14px 30px;
                background-color: #4F46E5;
                color: white;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 600;
                margin: 20px 0;
              }
              .button:hover {
                background-color: #4338CA;
              }
              .footer {
                margin-top: 30px;
                text-align: center;
                color: #666;
                font-size: 14px;
              }
              .divider {
                height: 1px;
                background-color: #e5e5e5;
                margin: 20px 0;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">🐾 ${APP_NAME}</div>
                <h1 style="color: #333; margin: 0;">Verify Your Email</h1>
              </div>
              
              <p>Hi ${userName},</p>
              
              <p>Welcome to ${APP_NAME}! We're excited to have you on board. Please verify your email address by clicking the button below:</p>
              
              <div style="text-align: center;">
                <a href="${verificationUrl}" class="button">Verify Email Address</a>
              </div>
              
              <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
              <p style="color: #4F46E5; word-break: break-all; font-size: 14px;">${verificationUrl}</p>
              
              <div class="divider"></div>
              
              <p style="color: #666; font-size: 14px;">This link will expire in 24 hours. If you didn't create an account with ${APP_NAME}, you can safely ignore this email.</p>
              
              <div class="footer">
                <p>Need help? Contact us at support@mypetapp.com</p>
                <p>&copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `
    }),
  
    /**
     * Password reset template
     */
    resetPassword: (userName: string, resetUrl: string) => ({
      subject: `Reset your password for ${APP_NAME}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset Your Password</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f5f5f5;
              }
              .container {
                background-color: white;
                border-radius: 10px;
                padding: 30px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              }
              .header {
                text-align: center;
                margin-bottom: 30px;
              }
              .logo {
                font-size: 28px;
                font-weight: bold;
                color: #4F46E5;
                margin-bottom: 10px;
              }
              .button {
                display: inline-block;
                padding: 14px 30px;
                background-color: #4F46E5;
                color: white;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 600;
                margin: 20px 0;
              }
              .button:hover {
                background-color: #4338CA;
              }
              .warning {
                background-color: #FEF3C7;
                border: 1px solid #F59E0B;
                border-radius: 6px;
                padding: 15px;
                margin: 20px 0;
                color: #92400E;
              }
              .footer {
                margin-top: 30px;
                text-align: center;
                color: #666;
                font-size: 14px;
              }
              .divider {
                height: 1px;
                background-color: #e5e5e5;
                margin: 20px 0;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">🐾 ${APP_NAME}</div>
                <h1 style="color: #333; margin: 0;">Reset Your Password</h1>
              </div>
              
              <p>Hi ${userName},</p>
              
              <p>We received a request to reset your password. Click the button below to create a new password:</p>
              
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </div>
              
              <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
              <p style="color: #4F46E5; word-break: break-all; font-size: 14px;">${resetUrl}</p>
              
              <div class="warning">
                <strong>⚠️ Security Notice:</strong> This link will expire in 1 hour. If you didn't request a password reset, please ignore this email or contact support if you have concerns.
              </div>
              
              <div class="divider"></div>
              
              <div class="footer">
                <p>Need help? Contact us at support@mypetapp.com</p>
                <p>&copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `
    }),
  
    /**
     * Email change verification template
     */
    changeEmail: (userName: string, newEmail: string, verificationUrl: string) => ({
      subject: `Confirm your email change for ${APP_NAME}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Confirm Email Change</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f5f5f5;
              }
              .container {
                background-color: white;
                border-radius: 10px;
                padding: 30px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              }
              .header {
                text-align: center;
                margin-bottom: 30px;
              }
              .logo {
                font-size: 28px;
                font-weight: bold;
                color: #4F46E5;
                margin-bottom: 10px;
              }
              .button {
                display: inline-block;
                padding: 14px 30px;
                background-color: #4F46E5;
                color: white;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 600;
                margin: 20px 0;
              }
              .info-box {
                background-color: #EBF5FF;
                border: 1px solid #3B82F6;
                border-radius: 6px;
                padding: 15px;
                margin: 20px 0;
                color: #1E40AF;
              }
              .footer {
                margin-top: 30px;
                text-align: center;
                color: #666;
                font-size: 14px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">🐾 ${APP_NAME}</div>
                <h1 style="color: #333; margin: 0;">Confirm Email Change</h1>
              </div>
              
              <p>Hi ${userName},</p>
              
              <p>You've requested to change your email address to:</p>
              
              <div class="info-box">
                <strong>${newEmail}</strong>
              </div>
              
              <p>Please confirm this change by clicking the button below:</p>
              
              <div style="text-align: center;">
                <a href="${verificationUrl}" class="button">Confirm Email Change</a>
              </div>
              
              <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
              <p style="color: #4F46E5; word-break: break-all; font-size: 14px;">${verificationUrl}</p>
              
              <p style="color: #666; font-size: 14px; margin-top: 20px;">If you didn't request this change, please ignore this email and your email address will remain unchanged.</p>
              
              <div class="footer">
                <p>Need help? Contact us at support@mypetapp.com</p>
                <p>&copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `
    })
  };
  
  /**
   * Email service functions
   */
  export const emailService = {
    /**
     * Send email verification
     */
    async sendVerificationEmail(user: { email: string; name: string }, verificationUrl: string): Promise<EmailResult> {
      const { subject, html } = emailTemplates.verifyEmail(user.name, verificationUrl);
      return sendEmail({ to: user.email, subject, html });
    },
  
    /**
     * Send password reset email
     */
    async sendPasswordResetEmail(user: { email: string; name: string }, resetUrl: string): Promise<EmailResult> {
      const { subject, html } = emailTemplates.resetPassword(user.name, resetUrl);
      return sendEmail({ to: user.email, subject, html });
    },
  
    /**
     * Send email change verification
     */
    async sendEmailChangeVerification(user: { email: string; name: string }, newEmail: string, verificationUrl: string): Promise<EmailResult> {
      const { subject, html } = emailTemplates.changeEmail(user.name, newEmail, verificationUrl);
      // Send to the NEW email address
      return sendEmail({ to: newEmail, subject, html });
    }
  };