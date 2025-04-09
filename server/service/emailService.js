const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config();

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail', // e.g., 'gmail'
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

/**
 * Send approval email with appointment details to the user
 * @param {Object} user - User data with appointment details
 * @returns {Promise} - Email sending result
 */
const sendApprovalEmail = async (user) => {
  if (!user || !user.email) {
    throw new Error('Invalid user data: email is required');
  }

  // Format appointment date if exists
  const appointmentDate = user.appointment_date 
    ? new Date(user.appointment_date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : 'Not scheduled';

  // Prepare HTML email template
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #4a4a4a;">Registration Approved</h2>
      </div>
      
      <p style="color: #666; font-size: 16px; line-height: 1.5;">Dear <strong>${user.name}</strong>,</p>
      
      <p style="color: #666; font-size: 16px; line-height: 1.5;">
        We are pleased to inform you that your pre-registration has been <strong style="color: #28a745;">approved</strong>.
      </p>
      
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="color: #4a4a4a; margin-top: 0;">Appointment Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #666; width: 40%;">Date:</td>
            <td style="padding: 8px 0; color: #333; font-weight: bold;">${appointmentDate}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Time:</td>
            <td style="padding: 8px 0; color: #333; font-weight: bold;">${user.preferred_time || 'Not specified'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">Purpose of Visit:</td>
            <td style="padding: 8px 0; color: #333; font-weight: bold;">${user.purpose_of_visit || 'Not specified'}</td>
          </tr>
        </table>
      </div>
      
      <div style="background-color: #e9f7fe; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 0; color: #0c5460;">
          <strong>Important:</strong> Please arrive 15 minutes before your scheduled appointment time and bring all the necessary documents.
        </p>
      </div>
      
      <p style="color: #666; font-size: 16px;">If you have any questions or need to reschedule, please contact our office.</p>
      
      <p style="color: #666; font-size: 16px;">Thank you,<br>School Admissions Team</p>
    </div>
  `;

  // Configure email options
  const mailOptions = {
    from: `"School Admissions" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: 'Your Registration Has Been Approved',
    html: htmlContent,
    // Add text version for email clients that don't support HTML
    text: `
      Registration Approved
      
      Dear ${user.name},
      
      We are pleased to inform you that your pre-registration has been approved.
      
      Appointment Details:
      Date: ${appointmentDate}
      Time: ${user.preferred_time || 'Not specified'}
      Purpose of Visit: ${user.purpose_of_visit || 'Not specified'}
      
      Important: Please arrive 15 minutes before your scheduled appointment time and bring all the necessary documents.
      
      If you have any questions or need to reschedule, please contact our office.
      
      Thank you,
      School Admissions Team
    `
  };

  try {
    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending approval email:', error);
    throw error;
  }
};

module.exports = {
  sendApprovalEmail
};