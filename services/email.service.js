const success = (message, data = {}) => ({ status: 'success', message, data });
const error = (code, message) => ({ status: 'error', error: { code, message } });

/**
 * Brevo Email Service
 * Uses Brevo's SMTP API to send transactional emails.
 */
class EmailService {
    constructor() {
        this.apiSmtpUrl = 'https://api.brevo.com/v3/smtp/email';
        this.apiCampaignUrl = 'https://api.brevo.com/v3/emailCampaigns';
    }

    /**
     * Sends a transactional email using Brevo.
     */
    async sendEmail({ to, subject, htmlContent }) {
        const apiKey = process.env.BREVO_API_KEY;
        const senderName = process.env.EMAIL_SENDER_NAME || 'PaySim Platform';
        const senderEmail = process.env.EMAIL_SENDER_ADDR || 'noreply@paysim.com';

        if (!apiKey) {
            console.warn('⚠️ [EMAIL_SERVICE] BREVO_API_KEY is missing. Falling back to console simulation.');
            console.log(`\n--- SIMULATED EMAIL START ---`);
            console.log(`To      : ${to}`);
            console.log(`Subject : ${subject}`);
            console.log(`Content : ${htmlContent.replace(/<[^>]*>/g, '').trim().substring(0, 200)}...`);
            console.log(`--- SIMULATED EMAIL END ---\n`);
            return success('Simulated email sent (API key missing)');
        }

        try {
            const response = await fetch(this.apiSmtpUrl, {
                method: 'POST',
                headers: {
                    'accept': 'application/json',
                    'api-key': apiKey,
                    'content-type': 'application/json'
                },
                body: JSON.stringify({
                    sender: { name: senderName, email: senderEmail },
                    to: [{ email: to }],
                    subject: subject,
                    htmlContent: htmlContent
                })
            });

            const data = await response.json();

            if (!response.ok) {
                console.error('❌ [EMAIL_SERVICE] Brevo API Error:', JSON.stringify(data, null, 2));
                return error('BREVO_ERROR', data.message || 'Failed to send email');
            }

            console.log(`✅ [EMAIL_SERVICE] Email sent successfully to ${to}. MessageID: ${data.messageId}`);
            return success('Email sent successfully', data);
        } catch (err) {
            console.error('❌ [EMAIL_SERVICE] Network Error:', err.message);
            return error('NETWORK_ERROR', 'Failed to connect to email service');
        }
    }

    /**
     * Creates an email campaign using Brevo.
     * @param {Object} campaign - Campaign settings
     */
    async createCampaign({ name, subject, htmlContent, recipients, scheduledAt, type = 'classic' }) {
        const apiKey = process.env.BREVO_API_KEY;
        const senderName = process.env.EMAIL_SENDER_NAME || 'PaySim Platform';
        const senderEmail = process.env.EMAIL_SENDER_ADDR || 'noreply@paysim.com';

        if (!apiKey) {
            console.warn('⚠️ [EMAIL_SERVICE] BREVO_API_KEY missing for Campaign.');
            return success('Simulated campaign created (API key missing)');
        }

        try {
            const response = await fetch(this.apiCampaignUrl, {
                method: 'POST',
                headers: {
                    'accept': 'application/json',
                    'api-key': apiKey,
                    'content-type': 'application/json'
                },
                body: JSON.stringify({
                    name,
                    subject,
                    sender: { name: senderName, email: senderEmail },
                    type,
                    htmlContent,
                    recipients,
                    scheduledAt
                })
            });

            const data = await response.json();

            if (!response.ok) {
                console.error('[EMAIL_SERVICE] Brevo API Error (Campaign):', data);
                return error('BREVO_ERROR', data.message || 'Failed to create campaign');
            }

            return success('Campaign created successfully', data);
        } catch (err) {
            console.error('[EMAIL_SERVICE] Network Error (Campaign):', err);
            return error('NETWORK_ERROR', 'Failed to connect to campaign service');
        }
    }

    /**
     * Sends an OTP for registration or payment.
     */
    async sendOTP(email, otp, type = 'registration') {
        const subjects = {
            registration: 'Verify Your PaySim Account',
            login: 'Your PaySim Login Code',
            payment: 'Authorize Your Payment',
            reset: 'Reset Your PaySim Password'
        };

        const labels = {
            registration: 'Registration',
            login: 'Login Verification',
            payment: 'Payment Authorization',
            reset: 'Password Reset'
        };

        const subject = subjects[type] || subjects.registration;
        const contentLabel = labels[type] || labels.registration;

        const htmlContent = `
            <div style="font-family: sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #3b82f6; text-align: center;">PaySim Platform</h2>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                <p>Hello,</p>
                <p>Your 6-digit <strong>${contentLabel} OTP</strong> is:</p>
                <div style="background: #f1f5f9; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; border-radius: 5px; color: #1e293b; margin: 20px 0;">
                    ${otp}
                </div>
                <p style="font-size: 14px; color: #64748b;">This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 12px; color: #94a3b8; text-align: center;">&copy; 2026 PaySim Platform. All rights reserved.</p>
            </div>
        `;

        return await this.sendEmail({ to: email, subject, htmlContent });
    }
}

module.exports = new EmailService();
