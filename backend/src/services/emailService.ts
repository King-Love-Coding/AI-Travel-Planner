// services/emailService.ts
import nodemailer from 'nodemailer';

// Create transporter (using Gmail as example)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD, // Use app password for Gmail
  },
});

export const emailService = {
  async sendInvitationEmail(
    to: string,
    inviterName: string,
    tripName: string,
    tripDestination: string,
    invitationToken: string
  ) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'TravelPlanner <noreply@travelplanner.com>',
        to,
        subject: `You've been invited to join ${tripName}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>✈️ TravelPlanner Invitation</h1>
              </div>
              <div class="content">
                <h2>You're Invited!</h2>
                <p><strong>${inviterName}</strong> has invited you to join their trip:</p>
                
                <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;">
                  <h3 style="margin: 0; color: #667eea;">${tripName}</h3>
                  ${tripDestination ? `<p style="margin: 5px 0; color: #666;">📍 ${tripDestination}</p>` : ''}
                </div>
                
                <p>Join the trip to:</p>
                <ul>
                  <li>View trip itinerary and activities</li>
                  <li>Collaborate on expenses</li>
                  <li>Share photos and memories</li>
                  <li>Coordinate with other travelers</li>
                </ul>
                
                <div style="text-align: center;">
                  <a href="${process.env.FRONTEND_URL}/accept-invitation/${invitationToken}" class="button">
                    View Invitation
                  </a>
                </div>
                
                <p style="color: #666; font-size: 14px;">
                  Or copy and paste this link in your browser:<br>
                  ${process.env.FRONTEND_URL}/accept-invitation/${invitationToken}
                </p>
              </div>
              <div class="footer">
                <p>This invitation was sent from TravelPlanner. If you received this in error, please ignore this email.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

      const result = await transporter.sendMail(mailOptions);
      console.log('Invitation email sent to:', to);
      return result;
    } catch (error) {
      console.error('Failed to send invitation email:', error);
      throw new Error('Failed to send invitation email');
    }
  },
};